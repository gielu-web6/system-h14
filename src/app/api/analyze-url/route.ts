import { NextRequest, NextResponse } from 'next/server'
import { getAnthropic, hasAnthropicKey, CLAUDE_MODEL } from '@/lib/ai/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL jest wymagany' }, { status: 400 })
    }

    // Basic URL validation
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: 'Nieprawidłowy URL' }, { status: 400 })
    }

    if (!hasAnthropicKey()) {
      const hostname = parsedUrl.hostname.replace(/^www\./, '')
      const guessedName = hostname.split('.')[0]
      return NextResponse.json({
        result: {
          companyName: guessedName.charAt(0).toUpperCase() + guessedName.slice(1),
          industry: 'agencja marketingowa',
          observations: 'Brak chatbota na stronie, brak widocznego CTA do kontaktu, strona bez sekcji case studies',
        },
        _demo: true,
      })
    }

    // Fetch the page
    const fetchRes = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; H14-Outreach-Bot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })

    if (!fetchRes.ok) {
      return NextResponse.json({ error: `Nie można pobrać strony (${fetchRes.status})` }, { status: 400 })
    }

    const html = await fetchRes.text()
    // Trim HTML to avoid huge context — send first 15k chars
    const trimmedHtml = html.slice(0, 15000)

    const anthropic = getAnthropic()
    const analysisRes = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system: `Analizujesz stronę internetową firmy aby wyciągnąć informacje do cold outreach.
Odpowiedz TYLKO JSON-em bez żadnych dodatkowych znaków:
{
  "companyName": "<nazwa firmy>",
  "industry": "<branża np. agencja marketingowa, firma IT, kancelaria prawna>",
  "observations": "<2-3 konkretne obserwacje do cold outreach: co mają, czego brakuje, co jest ważne np. 'Brak chatbota na stronie', 'Aktywny blog ale brak CTA', 'Sekcja o klienach bardzo słaba'>"
}`,
      messages: [{
        role: 'user',
        content: `URL: ${parsedUrl.toString()}\n\nHTML strony (fragment):\n${trimmedHtml}`,
      }],
    })

    const raw = (analysisRes.content.find(b => b.type === 'text') as { type: 'text'; text: string } | undefined)?.text ?? ''
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json({ result })
  } catch (err) {
    console.error('analyze-url error:', err)
    const msg = err instanceof Error ? err.message : 'Błąd analizy strony'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
