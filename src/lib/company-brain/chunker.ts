import { getOpenAI } from '@/lib/openai'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

export async function chunkAndEmbed(
  fileId: string,
  rawText: string,
  category: string,
  priority: number = 1
): Promise<number> {
  const supabase = getSupabaseAdmin()
  const chunks = splitIntoChunks(rawText, CHUNK_SIZE, CHUNK_OVERLAP)
  if (!chunks.length) return 0

  let processedCount = 0

  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10)

    const embeddingResponse = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    })

    const summaries = await generateSummaries(batch)

    const chunkRecords = batch.map((content, j) => ({
      file_id: fileId,
      category,
      content,
      content_summary: summaries[j] || null,
      chunk_index: i + j,
      chunk_total: chunks.length,
      embedding: JSON.stringify(embeddingResponse.data[j]?.embedding ?? []),
      priority,
    }))

    const { error } = await supabase.from('context_chunks').insert(chunkRecords)
    if (error) throw error

    processedCount += batch.length

    if (i + 10 < chunks.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return processedCount
}

function splitIntoChunks(text: string, targetTokens: number, overlap: number): string[] {
  const charsPerChunk = targetTokens * 3
  const overlapChars = overlap * 3

  const chunks: string[] = []
  const paragraphs = text.split(/\n{2,}/)
  let currentChunk = ''

  for (const para of paragraphs) {
    if ((currentChunk + para).length > charsPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = currentChunk.slice(-overlapChars) + '\n\n' + para
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim())

  return chunks.filter(c => c.length > 50)
}

async function generateSummaries(chunks: string[]): Promise<string[]> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Dla każdego fragmentu tekstu napisz JEDNO zdanie (max 15 słów) opisujące czego dotyczy. Odpowiedz jako JSON array stringów.

Fragmenty:
${chunks.map((c, i) => `${i + 1}. ${c.slice(0, 200)}...`).join('\n\n')}

Odpowiedz TYLKO jako JSON: {"summaries": ["summary1", "summary2", ...]}`
      }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })
    const result = JSON.parse(response.choices[0].message.content ?? '{}')
    return result.summaries ?? chunks.map(() => '')
  } catch {
    return chunks.map(() => '')
  }
}
