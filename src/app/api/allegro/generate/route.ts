import { NextRequest, NextResponse } from 'next/server'
import { getAnthropic, hasAnthropicKey } from '@/lib/ai/anthropic'

const MODEL = 'claude-sonnet-5'

const SYSTEM_PROMPT = `Jesteś ekspertem od tworzenia ofert sprzedażowych na Allegro (polski marketplace).
Z danych o produkcie tworzysz ofertę, która realnie sprzedaje i jest zgodna z zasadami Allegro.

TYTUŁ (najważniejszy element):
- Maksymalnie 75 znaków ze spacjami. Minimum 12 znaków i minimum 3 słowa.
- Najważniejsze słowa kluczowe NA POCZĄTKU.
- Pisz językiem, jakim kupujący SZUKA produktu, nie żargonem producenta
  (np. "Kabel USB-C do iPhone 15", a nie "Przewód transmisji danych typ C").
- Tytuł dotyczy WYŁĄCZNIE produktu.
- ZAKAZANE w tytule: słowa reklamowe (HIT, Okazja, Promocja, Wyprzedaż, najtaniej,
  tanio, nowość, mega, super, promo, rabat), cena, stan magazynowy ("ostatnie sztuki"),
  lokalizacja, dane kontaktowe, wykrzykniki, pytajniki, gwiazdki, emoji i ozdobniki,
  oraz pisanie całych słów WERSALIKAMI.

OPIS (pod edytor blokowy Allegro):
- Czysty tekst, BEZ HTML, BEZ linków komercyjnych. Zoptymalizowany pod telefon.
- Struktura: krótki hak → najważniejsze korzyści (wypunktowane) → kluczowe cechy /
  specyfikacja → zawartość zestawu (jeśli znana) → FAQ (2–4 pytania z odpowiedziami)
  → wezwanie do działania. Krótkie akapity, żadnych ścian tekstu.

ZASADA PRAWDY (twarda):
- NIE wymyślaj faktów, których nie ma w danych wejściowych: nie zmyślaj specyfikacji,
  gwarancji, czasu wysyłki, materiałów ani stanów. Czego nie wiesz — pomiń.
- Zero fałszywych obietnic. Nic, co łamałoby regulamin Allegro.

PARAMETRY: zaproponuj marka, model, EAN, kolor, rozmiar — tylko jeśli wynikają z danych.

FORMAT ODPOWIEDZI: zwróć WYŁĄCZNIE surowy JSON, bez markdown i bez \`\`\`:
{"title":"…","title_variants":["…","…","…"],"description":"…","keywords":["…"],
 "params":{"marka":"","model":"","ean":"","kolor":"","rozmiar":""}}`

const BANNED = /\b(hit|okazja|promocja|wyprzedaż|najtaniej|tanio|nowość|mega|super|promo|rabat)\b/gi

interface AllegroGenerateResult {
  title: string
  title_variants: string[]
  description: string
  keywords: string[]
  params: {
    marka: string
    model: string
    ean: string
    kolor: string
    rozmiar: string
  }
  warnings: string[]
}

function extractJson(raw: string): string {
  // Strip markdown fences and surrounding text
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  // Find first { ... last }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1)
  return raw.trim()
}

function tryParse(s: string): unknown | null {
  try { return JSON.parse(s) } catch { return null }
}

// Naprawia JSON ucięty w połowie (limit tokenów): domyka niezamknięty string
// i balansuje otwarte nawiasy { [.
function repairTruncatedJson(input: string): string {
  let s = input.trim().replace(/,\s*$/, '')
  let inStr = false, esc = false
  const stack: string[] = []
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (esc) { esc = false; continue }
    if (c === '\\') { if (inStr) esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '{' || c === '[') stack.push(c)
    else if (c === '}' || c === ']') stack.pop()
  }
  if (inStr) s += '"'
  s = s.replace(/,\s*$/, '')
  for (let i = stack.length - 1; i >= 0; i--) s += stack[i] === '{' ? '}' : ']'
  return s
}

// Odzyskiwanie best-effort: parse wprost → naprawa → przycinanie ogona + naprawa.
function coerceJson(candidate: string): Record<string, unknown> | null {
  let p = tryParse(candidate)
  if (p && typeof p === 'object') return p as Record<string, unknown>
  p = tryParse(repairTruncatedJson(candidate))
  if (p && typeof p === 'object') return p as Record<string, unknown>
  let s = candidate
  for (let i = 0; i < 400 && s.length > 2; i++) {
    s = s.slice(0, -1)
    p = tryParse(repairTruncatedJson(s))
    if (p && typeof p === 'object') return p as Record<string, unknown>
  }
  return null
}

function sanitizeTitle(title: string): { title: string; warnings: string[] } {
  const warnings: string[] = []

  // Remove banned words
  if (BANNED.test(title)) {
    BANNED.lastIndex = 0
    title = title.replace(BANNED, '').replace(/  +/g, ' ').trim()
    warnings.push('Tytuł zawierał zakazane słowa reklamowe — zostały usunięte.')
  }
  BANNED.lastIndex = 0

  // Trim to 75 chars at last full word
  if (title.length > 75) {
    const cut = title.slice(0, 75)
    const lastSpace = cut.lastIndexOf(' ')
    title = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()
    warnings.push('Tytuł przekraczał 75 znaków — przycięty do ostatniego pełnego słowa.')
  }

  // Warn if too short or too few words
  if (title.length < 12) {
    warnings.push('Tytuł ma mniej niż 12 znaków — rozważ rozwinięcie.')
  }
  if (title.split(/\s+/).filter(Boolean).length < 3) {
    warnings.push('Tytuł ma mniej niż 3 słowa — rozważ rozwinięcie.')
  }

  return { title, warnings }
}

export async function POST(req: NextRequest) {
  try {
    const { productName, baseDescription, category, params } = await req.json() as {
      productName: string
      baseDescription?: string
      category?: string
      params?: string
    }

    if (!productName || typeof productName !== 'string' || !productName.trim()) {
      return NextResponse.json({ error: 'Nazwa produktu jest wymagana.' }, { status: 400 })
    }

    if (!hasAnthropicKey()) {
      return NextResponse.json({ error: 'Brak klucza ANTHROPIC_API_KEY na serwerze.' }, { status: 500 })
    }

    const userMessage = [
      `Nazwa produktu: ${productName.trim()}`,
      `Opis bazowy: ${baseDescription?.trim() || '(brak)'}`,
      `Kategoria: ${category?.trim() || '(brak)'}`,
      `Parametry: ${params?.trim() || '(brak)'}`,
    ].join('\n')

    const anthropic = getAnthropic()

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ] as Parameters<typeof anthropic.messages.create>[0]['system'],
      messages: [
        { role: 'user', content: userMessage },
      ],
    })

    const rawText = (response.content.find(b => b.type === 'text') as { type: 'text'; text: string } | undefined)?.text ?? ''
    const jsonStr = extractJson(rawText)

    const parsed = coerceJson(jsonStr) as Omit<AllegroGenerateResult, 'warnings'> | null
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        { error: 'Model zwrócił niekompletny JSON (odpowiedź mogła zostać ucięta). Spróbuj ponownie lub skróć opis bazowy.' },
        { status: 502 },
      )
    }

    // Validate and sanitise title
    const { title: cleanTitle, warnings } = sanitizeTitle(String(parsed.title ?? ''))

    const result: AllegroGenerateResult = {
      title:          cleanTitle,
      title_variants: Array.isArray(parsed.title_variants) ? parsed.title_variants : [],
      description:    String(parsed.description ?? ''),
      keywords:       Array.isArray(parsed.keywords) ? parsed.keywords : [],
      params: {
        marka:   String(parsed.params?.marka   ?? ''),
        model:   String(parsed.params?.model   ?? ''),
        ean:     String(parsed.params?.ean     ?? ''),
        kolor:   String(parsed.params?.kolor   ?? ''),
        rozmiar: String(parsed.params?.rozmiar ?? ''),
      },
      warnings,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('allegro/generate error:', err)
    const msg = err instanceof Error ? err.message : 'Błąd generowania oferty.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
