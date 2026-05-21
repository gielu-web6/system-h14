export type Channel = 'linkedin' | 'email' | 'whatsapp'

export const CHANNEL_RULES: Record<Channel, string> = {
  linkedin: `KANAŁ: LinkedIn DM
- Dokładnie 5-6 zdań w głównej treści (nie więcej)
- Krótkie akapity — 1-2 zdania każdy
- Bez tematu wiadomości
- Bez stopki, bez sygnatury firmowej
- Tylko imię osoby wysyłającej na końcu
- NIE WSTAWIAJ LINKÓW w DM #1`,

  email: `KANAŁ: Cold Email
- Do 150 słów w głównej treści (bez tematu i podpisu)
- WYMAGANY temat wiadomości — krótki, ludzki, bez clickbaitu
  Przykłady dobre: "Krótka obserwacja o [nazwa_firmy]", "Pytanie odnośnie skalowania [nazwa_firmy]"
  Przykłady złe: "[WAŻNE] Twoja agencja traci pieniądze", "Ostatnia szansa!!!"
  Umieść temat jako pierwszą linię w formacie: Temat: [treść]
- Akapity mogą być nieco dłuższe (2-3 zdania)
- Delikatna stopka dozwolona: imię + jedna linia kontaktowa`,

  whatsapp: `KANAŁ: WhatsApp
- 3-4 zdania MAKSYMALNIE w głównej treści
- BARDZO bezpośredni, prawie SMS-owy ton
- Bez ozdobników, zero formalności
- Pytanie zamykające ma być binarne (tak/nie)`,
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  linkedin: 'LinkedIn DM',
  email: 'Cold Email',
  whatsapp: 'WhatsApp',
}
