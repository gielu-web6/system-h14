// fu2HotfixV2.test.ts
// Wymaga Jest lub Vitest (npm install -D vitest @vitest/globals).
// Testy czystych funkcji działają bez mocka. Testy integracyjne wymagają mocka OpenAI.

import {
  extractFirstWords,
  buildFU2PromptStrict,
  FU2_ROUTING,
} from '../promptComposer'
import {
  FU2_OPENING_VARIANTS,
  FU2_BODY_VARIANTS,
  FU2_CLOSING_VARIANTS,
} from '../prompts/fu2Variants'
import type { OutreachInput } from '../promptComposer'

const mockInput: OutreachInput = {
  messageType: 'fu2',
  channel: 'linkedin',
  companyName: 'TestowaAgencja',
  decisionMakerName: 'Marek',
  decisionMakerRole: 'CEO',
  industry: 'agencje marketingowe',
  wysylajacy: 'Maciek',
  variantCount: 3,
  productName: 'ProdukTest',
}

describe('FU #2 HOTFIX v2 — brak możliwości klonowania', () => {

  // ─── Testy czystych funkcji (bez LLM) ────────────────────────────────────

  describe('extractFirstWords', () => {
    it('zwraca n pierwszych słów z pierwszej niepustej linii pomijając powitanie', () => {
      const tresc = 'Cześć Marek,\n\nNajlepsze rzeczy w sprzedaży B2B nie mają CTA.'
      expect(extractFirstWords(tresc, 5)).toEqual(['najlepsze', 'rzeczy', 'w', 'sprzedaży', 'b2b'])
    })

    it('pomija linie zaczynające się od "cześć"', () => {
      const tresc = 'Cześć Jan,\n\nMogę Ci coś powiedzieć?'
      expect(extractFirstWords(tresc, 3)).toEqual(['mogę', 'ci', 'coś'])
    })

    it('zwraca pustą tablicę dla pustego tekstu', () => {
      expect(extractFirstWords('', 5)).toEqual([])
    })
  })

  describe('FU2_ROUTING — hard-coded routing', () => {
    it('wariant 0 to zawsze PYTANIE', () => {
      expect(FU2_ROUTING[0].szkola).toBe('PYTANIE')
    })

    it('wariant 1 to zawsze TEZA', () => {
      expect(FU2_ROUTING[1].szkola).toBe('TEZA')
    })

    it('wariant 2 to zawsze LICZBA', () => {
      expect(FU2_ROUTING[2].szkola).toBe('LICZBA')
    })

    it('każda szkoła wskazuje na inny body_id', () => {
      const bodyIds = FU2_ROUTING.map(r => r.body_id)
      expect(new Set(bodyIds).size).toBe(3)
    })

    it('każda szkoła wskazuje na inne zamknięcie', () => {
      const closingIdxs = FU2_ROUTING.map(r => r.closing_idx)
      expect(new Set(closingIdxs).size).toBe(3)
    })
  })

  describe('buildFU2PromptStrict — brak złych fraz w prompcie', () => {
    const opening = FU2_OPENING_VARIANTS.find(v => v.szkola === 'PYTANIE')!
    const body    = FU2_BODY_VARIANTS.find(v => v.id === 'tempo_vs_liczba')!
    const closing = FU2_CLOSING_VARIANTS[0]

    it('prompt nie zawiera "Dziś nic od Ciebie"', () => {
      const prompt = buildFU2PromptStrict({
        input: mockInput,
        productName: 'ProdukTest',
        opening, body, closing,
        blacklistaPierwszychSlow: [],
        numerWariantu: 1,
      })
      expect(prompt.toLowerCase()).not.toContain('dziś nic od ciebie')
    })

    it('prompt nie zawiera "9 na 10"', () => {
      const prompt = buildFU2PromptStrict({
        input: mockInput,
        productName: 'ProdukTest',
        opening, body, closing,
        blacklistaPierwszychSlow: [],
        numerWariantu: 1,
      })
      expect(prompt).not.toMatch(/9 na 10|dziewięciu na dziesięć|9\/10/)
    })

    it('prompt wariantu 2 zawiera blacklistę słów z wariantu 1', () => {
      const blacklista = ['mogę', 'ci', 'coś', 'powiedzieć', 'bez']
      const opening2 = FU2_OPENING_VARIANTS.find(v => v.szkola === 'TEZA')!
      const body2    = FU2_BODY_VARIANTS.find(v => v.id === 'wlasciciel_blokuje')!
      const closing2 = FU2_CLOSING_VARIANTS[1]

      const prompt = buildFU2PromptStrict({
        input: mockInput,
        productName: 'ProdukTest',
        opening: opening2, body: body2, closing: closing2,
        blacklistaPierwszychSlow: blacklista,
        numerWariantu: 2,
      })
      expect(prompt).toContain('ZABRONIONE PIERWSZE SŁOWA')
      blacklista.forEach(slowo => expect(prompt).toContain(slowo))
    })

    it('prompt wariantu 1 NIE zawiera sekcji blacklisty (jest pierwszym wariantem)', () => {
      const prompt = buildFU2PromptStrict({
        input: mockInput,
        productName: 'ProdukTest',
        opening, body, closing,
        blacklistaPierwszychSlow: [],
        numerWariantu: 1,
      })
      expect(prompt).not.toContain('ZABRONIONE PIERWSZE SŁOWA')
    })

    it('prompt zawiera DOKŁADNĄ linię otwarcia z banku wariantów', () => {
      const prompt = buildFU2PromptStrict({
        input: mockInput,
        productName: 'ProdukTest',
        opening, body, closing,
        blacklistaPierwszychSlow: [],
        numerWariantu: 1,
      })
      // Otwarcie PYTANIE po podstawieniu imienia
      expect(prompt).toContain('Mogę Ci coś powiedzieć bez żadnej ukrytej agendy?')
    })
  })

  describe('FU2_OPENING_VARIANTS — brak złych fraz w bankach', () => {
    it('żaden wariant otwarcia nie zawiera "Dziś nic od Ciebie"', () => {
      FU2_OPENING_VARIANTS.forEach(v => {
        expect(v.template.toLowerCase()).not.toContain('dziś nic od ciebie')
      })
    })

    it('żaden wariant otwarcia nie zawiera "9 na 10"', () => {
      FU2_OPENING_VARIANTS.forEach(v => {
        expect(v.template).not.toMatch(/9 na 10|dziewięciu na dziesięć|9\/10/)
      })
    })

    it('banki zawierają szkoły PYTANIE, TEZA, LICZBA', () => {
      const szkoly = FU2_OPENING_VARIANTS.map(v => v.szkola)
      expect(szkoly).toContain('PYTANIE')
      expect(szkoly).toContain('TEZA')
      expect(szkoly).toContain('LICZBA')
    })
  })

  describe('FU2_BODY_VARIANTS — zakazane zwroty w zabezpieczeniach', () => {
    it('każdy body variant ma listę zakazanych zwrotów', () => {
      FU2_BODY_VARIANTS.forEach(v => {
        expect(Array.isArray(v.zakazane_zwroty_dla_llm)).toBe(true)
        expect(v.zakazane_zwroty_dla_llm.length).toBeGreaterThan(0)
      })
    })

    it('zakazane zwroty obejmują "u 9 na 10" w każdym body', () => {
      FU2_BODY_VARIANTS.forEach(v => {
        expect(v.zakazane_zwroty_dla_llm).toContain('u 9 na 10')
      })
    })
  })
})
