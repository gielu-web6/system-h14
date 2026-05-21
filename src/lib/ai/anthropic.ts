import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

export function getAnthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured.')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
