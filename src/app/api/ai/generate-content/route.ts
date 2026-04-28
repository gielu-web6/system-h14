import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { buildContext } from '@/lib/company-brain/context-builder'

export async function POST(req: NextRequest) {
  try {
    const { channel, content_type, title, hook, slideCount, linkedinProfileUrl } = await req.json()

    const [profile, brainCtx] = await Promise.all([
      getCompanyProfile(),
      buildContext('content_generator', {
        query: `Post o: ${title ?? hook ?? 'firmowa treść'}, kanał: ${channel ?? 'linkedin'}, format: ${content_type ?? 'post'}`,
      }).catch(() => null),
    ])
    const companyCtx = buildCompanyContext(profile)

    const CHANNEL_LABELS: Record<string, string> = {
      instagram: 'Instagram',
      linkedin_company: 'LinkedIn (profil firmy)',
      linkedin_personal: 'LinkedIn (profil osobisty)',
      facebook: 'Facebook',
      newsletter: 'Newsletter e-mail',
    }

    const slides = slideCount ?? 7
    const TYPE_LABELS: Record<string, string> = {
      carousel: `karuzela (${slides} slajdów — napisz treść dla każdego slajdu osobno, oznaczając je: [Slajd 1], [Slajd 2], itd.)`,
      single_post: 'post z opisem',
      reel_script: 'skrypt do Reels (ok. 30 sek.)',
      story: 'story (krótki tekst)',
      linkedin_post: 'post LinkedIn (max 1300 znaków, storytelling, hook na początku)',
      article: 'artykuł (5-7 akapitów)',
      newsletter: 'newsletter',
    }

    const channelLabel = CHANNEL_LABELS[channel] ?? channel
    const typeLabel = TYPE_LABELS[content_type] ?? content_type

    const openai = getOpenAI()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś ekspertem od content marketingu B2B w Polsce. Tworzysz treści dla firmy na podstawie jej danych.

${brainCtx?.contextString ?? ''}
KONTEKST FIRMY (Baza Wiedzy):
${companyCtx}

Ton: ${profile?.tone_of_voice || 'bezpośredni, konkretny, ekspercki'}

Kanał: ${channelLabel}
Format: ${typeLabel}
${linkedinProfileUrl ? `Profil LinkedIn: ${linkedinProfileUrl}` : ''}

WAŻNE: Treść musi być KONKRETNA i oparta na danych firmy z Bazy Wiedzy. NIE pisz ogólnych treści.

Odpowiedz TYLKO JSON-em:
{
  "title": "<tytuł posta>",
  "hook": "<hook otwierający — pierwsze zdanie które zatrzyma przewijanie>",
  "content_body": "<pełna treść posta>",
  "cta": "<call to action>",
  "hashtags": ["<hashtag1>", "<hashtag2>", "<hashtag3>"]
}`,
        },
        {
          role: 'user',
          content: `Napisz ${typeLabel} na temat: "${title || hook || 'ogólny temat firmy'}"
${hook ? `Użyj tego hooka: "${hook}"` : ''}
${linkedinProfileUrl ? `Dostosuj język i styl do profilu: ${linkedinProfileUrl}` : ''}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json({ result })
  } catch (err) {
    console.error('generate-content error:', err)
    return NextResponse.json({ error: 'Błąd generowania treści' }, { status: 500 })
  }
}
