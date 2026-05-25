import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI, hasOpenAIKey, OPENAI_MODEL } from '@/lib/ai/openai'
import { CLASSIFICATION_PROMPT, TACTICS, type ReplyCategory } from '@/lib/ai/reply-tactics'
import { getDemoReply, guessCategory } from '@/lib/ai/demo-fallback'
import { buildContext } from '@/lib/company-brain/context-builder'

function withBrain(systemPrompt: string, brainCtx: string): string {
  if (!brainCtx.trim()) return systemPrompt
  return `## DANE FIRMOWE Z COMPANY BRAIN (priorytet nadrzędny):\n${brainCtx}\n\n---\n\n${systemPrompt}`
}

export async function POST(req: NextRequest) {
  try {
    const { originalMessage, prospectReply, daysSinceSent } = await req.json()

    if (!prospectReply || prospectReply.trim().length < 10) {
      return NextResponse.json({ error: 'Odpowiedź prospekta jest wymagana (min. 10 znaków)' }, { status: 400 })
    }

    if (!hasOpenAIKey()) {
      const category = guessCategory(prospectReply.trim())
      return NextResponse.json(getDemoReply(category))
    }

    const openai = getOpenAI()

    // Step 1: classify + fetch brain context in parallel
    const [classifyRes, brainCtx] = await Promise.all([
      openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 100,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CLASSIFICATION_PROMPT },
          { role: 'user', content: `Odpowiedź prospekta:\n"${prospectReply.trim()}"` },
        ],
      }),
      buildContext('outreach_generator', {
        query: `obsługa objekcji follow-up odpowiedź na wiadomość sprzedaż: ${prospectReply.trim().slice(0, 200)}`,
      }).catch(() => null),
    ])

    const brainString = brainCtx?.contextString ?? ''

    const classifyRaw = classifyRes.choices[0]?.message?.content ?? ''

    let classification: ReplyCategory = 'ZAINTERESOWANY_CHLODNY'
    let classificationReason = ''
    try {
      const cleaned = classifyRaw.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      classification = parsed.category as ReplyCategory
      classificationReason = parsed.reason ?? ''
    } catch {
      // fallback stays
    }

    const tactics = TACTICS[classification] ?? TACTICS['ZAINTERESOWANY_CHLODNY']

    const contextBlock = [
      originalMessage?.trim() ? `Oryginalna wiadomość którą wysłałem:\n"${originalMessage.trim()}"` : '',
      daysSinceSent ? `Dni od wysłania pierwszej wiadomości: ${daysSinceSent}` : '',
      `Odpowiedź prospekta:\n"${prospectReply.trim()}"`,
    ].filter(Boolean).join('\n\n')

    const userPrompt = `${contextBlock}

Napisz replikę zgodnie ze swoją taktyką.`

    // Step 2: 3 replies in parallel (skip silence tactic)
    const replyPromises = tactics.map(tactic => {
      if (tactic.isSilence) return Promise.resolve(null)
      return openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 300,
        messages: [
          { role: 'system', content: withBrain(tactic.systemPrompt, brainString) },
          { role: 'user', content: userPrompt },
        ],
      }).then(res => res.choices[0]?.message?.content ?? '').catch(() => '')
    })

    const replyResults = await Promise.all(replyPromises)

    const replies = tactics.map((tactic, i) => ({
      expert: tactic.expert,
      name: tactic.name,
      description: tactic.description,
      message: replyResults[i] ?? null,
      isSilence: tactic.isSilence ?? false,
    }))

    return NextResponse.json({
      classification,
      classificationReason,
      replies,
      _brainUsed: !!brainCtx?.dna,
    })
  } catch (err) {
    console.error('generate-reply error:', err)
    return NextResponse.json({ error: 'Błąd generowania repliki' }, { status: 500 })
  }
}
