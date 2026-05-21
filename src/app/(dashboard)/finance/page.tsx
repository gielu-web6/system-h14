'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign,
  CheckCircle2, Clock, AlertTriangle, X, Plus,
  Upload, Loader2, FileText, Receipt, Trash2,
  ArrowUpCircle, ArrowDownCircle, Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/userStore'
import { DEMO_INCOMES, DEMO_EXPENSES, DEMO_PNL, DEMO_PNL_TARGET } from '@/lib/demo-data'
import { PLChart } from '@/components/finance/PLChart'

// ─── Types ─────────────────────────────────────────────────────────────────────

type IncomeStatus = 'opłacona' | 'oczekująca' | 'zaległa'
type IncomeType   = 'zaliczka' | 'rata' | 'końcowa' | 'abonament' | 'faktura'

interface IncomeEntry {
  id: string
  client: string
  project: string
  amount: number        // netto
  vatRate: number       // 0, 5, 8, 23...
  vatAmount: number
  grossAmount: number
  netProfit: number     // kwota czysta (netto jeśli VAT>0, brutto jeśli VAT=0)
  type: IncomeType
  status: IncomeStatus
  date: string
  invoiceNumber?: string
  fromInvoice?: boolean
}

interface ExpenseEntry {
  id: string
  name: string
  category: string
  amount: number        // netto
  vatRate: number
  vatAmount: number
  grossAmount: number
  recurring: boolean
  date: string
  invoiceNumber?: string
  fromInvoice?: boolean
}

type Tab = 'overview' | 'income' | 'expenses'

// ─── Supabase helpers ─────────────────────────────────────────────────────────

function dbToIncome(row: Record<string, unknown>): IncomeEntry {
  return {
    id: row.id as string,
    client: row.client as string,
    project: row.project as string,
    amount: row.amount as number,
    vatRate: row.vat_rate as number,
    vatAmount: row.vat_amount as number,
    grossAmount: row.gross_amount as number,
    netProfit: row.net_profit as number,
    type: row.type as IncomeType,
    status: row.status as IncomeStatus,
    date: row.date as string,
    invoiceNumber: (row.invoice_number as string) ?? undefined,
    fromInvoice: (row.from_invoice as boolean) ?? undefined,
  }
}

function dbToExpense(row: Record<string, unknown>): ExpenseEntry {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    amount: row.amount as number,
    vatRate: row.vat_rate as number,
    vatAmount: row.vat_amount as number,
    grossAmount: row.gross_amount as number,
    recurring: row.recurring as boolean,
    date: row.date as string,
    invoiceNumber: (row.invoice_number as string) ?? undefined,
    fromInvoice: (row.from_invoice as boolean) ?? undefined,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPLN(v: number) {
  return v.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PLN'
}

function calcVat(net: number, vatRate: number) {
  const vatAmount  = Math.round(net * vatRate / 100 * 100) / 100
  const gross      = Math.round((net + vatAmount) * 100) / 100
  const netProfit  = vatRate === 0 ? gross : net  // 0% VAT: zysk = brutto; inny: zysk = netto
  return { vatAmount, gross, netProfit }
}

function currentMonth() { return new Date().toISOString().slice(0, 7) }
function formatDate(d: string) { try { return new Date(d).toLocaleDateString('pl-PL') } catch { return d } }

const INCOME_STATUS_CONFIG = {
  'opłacona':   { icon: CheckCircle2,  color: 'text-green-400',  label: 'Opłacona' },
  'oczekująca': { icon: Clock,         color: 'text-amber-400',  label: 'Oczekująca' },
  'zaległa':    { icon: AlertTriangle, color: 'text-red-400',    label: 'Zaległa' },
}

const VAT_RATES = [0, 5, 8, 23]
const EXPENSE_CATEGORIES = ['Narzędzia', 'Reklama', 'Podwykonawcy', 'Biuro', 'Szkolenia', 'Sprzęt', 'Inne']

// ─── Invoice Upload Modal ─────────────────────────────────────────────────────

interface InvoiceData {
  invoice_number?: string | null
  invoice_date?: string | null
  due_date?: string | null
  seller_name?: string | null
  buyer_name?: string | null
  description?: string | null
  net_amount?: number
  vat_rate?: number
  vat_amount?: number
  gross_amount?: number
  currency?: string
  type?: 'income' | 'expense' | 'unknown'
  category?: string
  notes?: string | null
}

function InvoiceUploadModal({
  onClose,
  onAddIncome,
  onAddExpense,
}: {
  onClose: () => void
  onAddIncome: (e: IncomeEntry) => void
  onAddExpense: (e: ExpenseEntry) => void
}) {
  const [file, setFile]             = useState<File | null>(null)
  const [analyzing, setAnalyzing]   = useState(false)
  const [data, setData]             = useState<InvoiceData | null>(null)
  const [entryType, setEntryType]   = useState<'income' | 'expense'>('income')
  const [status, setStatus]         = useState<IncomeStatus>('oczekująca')
  const [recurring, setRecurring]   = useState(false)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const handleFile = async (f: File) => {
    setFile(f)
    setData(null)
    setError(null)
    setAnalyzing(true)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Strip data URL prefix
          resolve(result.split(',')[1] ?? '')
        }
        reader.onerror = reject
        reader.readAsDataURL(f)
      })

      const res = await fetch('/api/ai/analyze-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, fileName: f.name, mimeType: f.type }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      const result: InvoiceData = json.result
      setData(result)
      // Auto-detect type
      if (result.type === 'income') setEntryType('income')
      else if (result.type === 'expense') setEntryType('expense')
    } catch (e: unknown) {
      setError((e as Error).message || 'Błąd analizy faktury')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = () => {
    if (!data) return
    const net   = data.net_amount  ?? 0
    const vat   = data.vat_rate    ?? 23
    const { vatAmount, gross, netProfit } = calcVat(net, vat)

    if (entryType === 'income') {
      onAddIncome({
        id: `inv-${Date.now()}`,
        client:        data.buyer_name  ?? data.seller_name ?? 'Nieznany',
        project:       data.description ?? 'Faktura',
        amount:        net,
        vatRate:       vat,
        vatAmount:     data.vat_amount  ?? vatAmount,
        grossAmount:   data.gross_amount ?? gross,
        netProfit,
        type:          'faktura',
        status,
        date:          data.invoice_date ?? new Date().toISOString().slice(0, 10),
        invoiceNumber: data.invoice_number ?? undefined,
        fromInvoice:   true,
      })
    } else {
      onAddExpense({
        id: `inv-${Date.now()}`,
        name:          data.description ?? data.seller_name ?? 'Faktura',
        category:      data.category ?? 'Inne',
        amount:        net,
        vatRate:       vat,
        vatAmount:     data.vat_amount  ?? vatAmount,
        grossAmount:   data.gross_amount ?? gross,
        recurring,
        date:          data.invoice_date ?? new Date().toISOString().slice(0, 10),
        invoiceNumber: data.invoice_number ?? undefined,
        fromInvoice:   true,
      })
    }
    setSaved(true)
    toast.success(`Faktura dodana jako ${entryType === 'income' ? 'przychód' : 'koszt'}`)
    setTimeout(onClose, 1200)
  }

  const inputCls = 'w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[500px] bg-[#0F0F1A] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] sticky top-0 bg-[#0F0F1A]">
          <div>
            <p className="text-[15px] font-bold text-white">Wgraj fakturę</p>
            <p className="text-[11px] text-white/40 mt-0.5">AI automatycznie odczyta dane i doda do systemu</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-green-400" />
            </div>
            <p className="text-[15px] font-semibold text-white">Faktura dodana!</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Upload zone */}
            {!file ? (
              <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-[14px] border-2 border-dashed border-white/[0.12] bg-white/[0.02] cursor-pointer hover:border-[#6366f1]/50 hover:bg-[#6366f1]/[0.03] transition-all">
                <div className="w-12 h-12 rounded-full bg-[#6366f1]/15 flex items-center justify-center">
                  <Upload size={20} className="text-[#6366f1]" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-white">Kliknij lub przeciągnij fakturę</p>
                  <p className="text-[11px] text-white/40 mt-1">PDF, JPG, PNG, WEBP — AI odczyta dane automatycznie</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-[10px] bg-white/[0.04] border border-white/[0.08]">
                <FileText size={16} className="text-[#6366f1] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-white/40">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => { setFile(null); setData(null) }} className="p-1 rounded text-white/30 hover:text-white transition-colors">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Analyzing */}
            {analyzing && (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 size={18} className="text-[#6366f1] animate-spin" />
                <div>
                  <p className="text-[13px] font-semibold text-white">AI analizuje fakturę...</p>
                  <p className="text-[11px] text-white/40">Odczytuje dane: kwoty, VAT, kontrahenci</p>
                </div>
              </div>
            )}

            {error && (
              <p className="text-[12px] text-red-400 text-center">{error}</p>
            )}

            {/* Extracted data */}
            {data && !analyzing && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#6366f1]/[0.07] border border-[#6366f1]/20">
                  <Sparkles size={13} className="text-[#a5b4fc] flex-shrink-0" />
                  <p className="text-[12px] text-[#a5b4fc]">AI odczytało fakturę. Sprawdź dane i zapisz.</p>
                </div>

                {/* Type toggle */}
                <div>
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Typ wpisu</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setEntryType('income')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-[8px] border text-[12px] font-semibold transition-all ${entryType === 'income' ? 'bg-green-500/15 border-green-500/40 text-green-400' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white'}`}>
                      <ArrowUpCircle size={13} /> Przychód (sprzedaż)
                    </button>
                    <button onClick={() => setEntryType('expense')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-[8px] border text-[12px] font-semibold transition-all ${entryType === 'expense' ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white'}`}>
                      <ArrowDownCircle size={13} /> Koszt (zakup)
                    </button>
                  </div>
                </div>

                {/* VAT summary */}
                <div className="p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.07] space-y-2">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-3">Dane z faktury</p>
                  {data.invoice_number && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/40">Nr faktury</span>
                      <span className="text-[11px] text-white font-semibold">{data.invoice_number}</span>
                    </div>
                  )}
                  {data.seller_name && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/40">Sprzedawca</span>
                      <span className="text-[11px] text-white font-semibold truncate ml-4 text-right">{data.seller_name}</span>
                    </div>
                  )}
                  {data.buyer_name && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/40">Nabywca</span>
                      <span className="text-[11px] text-white font-semibold truncate ml-4 text-right">{data.buyer_name}</span>
                    </div>
                  )}
                  <div className="border-t border-white/[0.07] pt-2 space-y-1.5 mt-2">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/40">Netto</span>
                      <span className="text-[12px] text-white font-bold">{formatPLN(data.net_amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/40">VAT ({data.vat_rate ?? 23}%)</span>
                      <span className="text-[11px] text-white/60">{formatPLN(data.vat_amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/40">Brutto</span>
                      <span className="text-[12px] text-white font-bold">{formatPLN(data.gross_amount ?? 0)}</span>
                    </div>
                    <div className="border-t border-white/[0.07] pt-1.5 flex justify-between">
                      <span className="text-[11px] text-white/50 font-semibold">
                        {data.vat_rate === 0 ? 'Zysk (VAT 0% → netto = brutto)' : 'Kwota czysta (bez VAT)'}
                      </span>
                      <span className="text-[13px] font-bold text-[#22c55e]">
                        {formatPLN(calcVat(data.net_amount ?? 0, data.vat_rate ?? 23).netProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status (income) or recurring (expense) */}
                {entryType === 'income' ? (
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Status płatności</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['opłacona', 'oczekująca', 'zaległa'] as IncomeStatus[]).map(s => (
                        <button key={s} onClick={() => setStatus(s)}
                          className={`py-2 rounded-[8px] border text-[11px] font-semibold transition-all capitalize ${status === s ? (s === 'opłacona' ? 'bg-green-500/15 border-green-500/40 text-green-400' : s === 'oczekująca' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-red-500/15 border-red-500/40 text-red-400') : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="w-4 h-4 accent-[#6366f1]" />
                    <span className="text-[12px] text-white/70">Koszt cykliczny (miesięczny)</span>
                  </label>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={onClose}
                    className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
                    Anuluj
                  </button>
                  <button onClick={handleSave}
                    className="flex-1 py-2.5 rounded-[10px] bg-[#6366f1] text-white text-[13px] font-bold hover:bg-[#5254cc] transition-all shadow-lg shadow-indigo-500/25">
                    Zapisz fakturę
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Income Modal (manual) ────────────────────────────────────────────────

function AddIncomeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: IncomeEntry) => void }) {
  const [form, setForm] = useState({ client: '', project: '', amount: '', vatRate: '23', type: 'zaliczka' as IncomeType, status: 'oczekująca' as IncomeStatus })
  const [saved, setSaved] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const net    = parseFloat(form.amount) || 0
    const vatR   = parseFloat(form.vatRate) || 0
    const { vatAmount, gross, netProfit } = calcVat(net, vatR)
    onAdd({ id: `inc-${Date.now()}`, client: form.client, project: form.project, amount: net, vatRate: vatR, vatAmount, grossAmount: gross, netProfit, type: form.type, status: form.status, date: new Date().toISOString().slice(0, 10) })
    setSaved(true); setTimeout(() => onClose(), 1200)
  }

  const inputCls = 'w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all'
  const labelCls = 'block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[440px] bg-[#0F0F1A] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <p className="text-[15px] font-bold text-white">Dodaj przychód</p>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
        </div>
        {saved ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle2 size={22} className="text-green-400" /></div>
            <p className="text-[15px] font-semibold text-white">Przychód dodany!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div><label className={labelCls}>Klient *</label>
              <input value={form.client} onChange={set('client')} required placeholder="Nazwa klienta" className={inputCls} /></div>
            <div><label className={labelCls}>Projekt / opis</label>
              <input value={form.project} onChange={set('project')} placeholder="Nazwa projektu" className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Kwota netto (PLN) *</label>
                <input value={form.amount} onChange={set('amount')} required type="number" step="0.01" placeholder="5000.00" className={inputCls} /></div>
              <div><label className={labelCls}>Stawka VAT (%)</label>
                <select value={form.vatRate} onChange={set('vatRate')} className="w-full px-3 py-2 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all">
                  {VAT_RATES.map(v => <option key={v} value={v}>{v}%</option>)}
                </select></div>
            </div>
            {form.amount && (
              <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] text-[11px] space-y-1">
                {(() => { const { vatAmount, gross, netProfit } = calcVat(parseFloat(form.amount)||0, parseFloat(form.vatRate)||0); return (
                  <>
                    <div className="flex justify-between"><span className="text-white/40">VAT ({form.vatRate}%)</span><span className="text-white/60">{formatPLN(vatAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Brutto</span><span className="text-white font-bold">{formatPLN(gross)}</span></div>
                    <div className="flex justify-between border-t border-white/[0.07] pt-1"><span className="text-white/50 font-semibold">{parseFloat(form.vatRate)===0?'Zysk (VAT 0%)':'Zysk netto'}</span><span className="text-green-400 font-bold">{formatPLN(netProfit)}</span></div>
                  </>
                )})()}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Typ</label>
                <select value={form.type} onChange={set('type')} className="w-full px-3 py-2 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all">
                  <option value="zaliczka">Zaliczka</option><option value="rata">Rata</option><option value="końcowa">Końcowa</option><option value="abonament">Abonament</option>
                </select></div>
              <div><label className={labelCls}>Status</label>
                <select value={form.status} onChange={set('status')} className="w-full px-3 py-2 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all">
                  <option value="opłacona">Opłacona</option><option value="oczekująca">Oczekująca</option><option value="zaległa">Zaległa</option>
                </select></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">Anuluj</button>
              <button type="submit" className="flex-1 py-2.5 rounded-[10px] bg-[#6366f1] text-white text-[13px] font-bold hover:bg-[#5254cc] transition-all">Dodaj</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Add Expense Modal (manual) ───────────────────────────────────────────────

function AddExpenseModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: ExpenseEntry) => void }) {
  const [form, setForm] = useState({ name: '', category: 'Narzędzia', amount: '', vatRate: '23', recurring: false })
  const [saved, setSaved] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const net  = parseFloat(form.amount) || 0
    const vatR = parseFloat(form.vatRate) || 0
    const { vatAmount, gross } = calcVat(net, vatR)
    onAdd({ id: `exp-${Date.now()}`, name: form.name, category: form.category, amount: net, vatRate: vatR, vatAmount, grossAmount: gross, recurring: form.recurring, date: new Date().toISOString().slice(0, 10) })
    setSaved(true); setTimeout(() => onClose(), 1200)
  }

  const inputCls = 'w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all'
  const labelCls = 'block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] bg-[#0F0F1A] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <p className="text-[15px] font-bold text-white">Dodaj koszt</p>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
        </div>
        {saved ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle2 size={22} className="text-green-400" /></div>
            <p className="text-[15px] font-semibold text-white">Koszt dodany!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div><label className={labelCls}>Nazwa *</label>
              <input value={form.name} onChange={set('name')} required placeholder="np. Subskrypcja Notion" className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Kwota netto (PLN) *</label>
                <input value={form.amount} onChange={set('amount')} required type="number" step="0.01" placeholder="299.00" className={inputCls} /></div>
              <div><label className={labelCls}>Stawka VAT (%)</label>
                <select value={form.vatRate} onChange={set('vatRate')} className="w-full px-3 py-2 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all">
                  {VAT_RATES.map(v => <option key={v} value={v}>{v}%</option>)}
                </select></div>
            </div>
            {form.amount && (
              <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] text-[11px]">
                {(() => { const { gross } = calcVat(parseFloat(form.amount)||0, parseFloat(form.vatRate)||0); return (
                  <div className="flex justify-between"><span className="text-white/40">Brutto (do zapłaty)</span><span className="text-red-400 font-bold">{formatPLN(gross)}</span></div>
                )})()}
              </div>
            )}
            <div><label className={labelCls}>Kategoria</label>
              <select value={form.category} onChange={set('category')} className="w-full px-3 py-2 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all">
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select></div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} className="w-4 h-4 accent-[#6366f1]" />
              <span className="text-[13px] text-white/70">Koszt cykliczny (miesięczny)</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">Anuluj</button>
              <button type="submit" className="flex-1 py-2.5 rounded-[10px] bg-[#6366f1] text-white text-[13px] font-bold hover:bg-[#5254cc] transition-all">Dodaj</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ incomes, expenses }: { incomes: IncomeEntry[]; expenses: ExpenseEntry[] }) {
  const month = currentMonth()
  const monthIncomes  = incomes.filter(i => i.date?.startsWith(month))
  const monthExpenses = expenses.filter(e => e.date?.startsWith(month))

  const totalIncome   = monthIncomes.filter(i => i.status === 'opłacona').reduce((s, i) => s + i.netProfit, 0)
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.grossAmount, 0)
  const netProfit     = totalIncome - totalExpenses
  const pending       = monthIncomes.filter(i => i.status === 'oczekująca').reduce((s, i) => s + i.netProfit, 0)

  const catMap: Record<string, number> = {}
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.grossAmount })
  const catList = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Przychód (zysk netto, ten miesiąc)', value: formatPLN(totalIncome), icon: TrendingUp,    color: '#22c55e' },
          { label: 'Koszty brutto (ten miesiąc)',        value: formatPLN(totalExpenses), icon: TrendingDown, color: '#ef4444' },
          { label: 'Zysk netto',                         value: formatPLN(netProfit),    icon: DollarSign,   color: netProfit >= 0 ? '#6366f1' : '#ef4444' },
          { label: 'Oczekujące należności',              value: formatPLN(pending),      icon: Clock,        color: '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#16213E] border border-white/[0.07] rounded-[12px] p-4">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-3" style={{ background: kpi.color + '20' }}>
              <kpi.icon size={15} style={{ color: kpi.color }} />
            </div>
            <p className="text-[10px] text-white/40 mb-0.5 leading-tight">{kpi.label}</p>
            <p className="text-[17px] font-bold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* P&L chart */}
      {isDemoMode() && (
        <PLChart data={DEMO_PNL} target={DEMO_PNL_TARGET} />
      )}

      {/* VAT info */}
      <div className="p-4 rounded-[12px] bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">Logika VAT</p>
        <p className="text-[11px] text-white/50 leading-relaxed">
          <span className="text-white/70 font-semibold">VAT 0%</span> → zysk = kwota brutto (bo nie ma podatku)
          &nbsp;·&nbsp;
          <span className="text-white/70 font-semibold">VAT {'>'} 0%</span> → zysk = kwota netto (VAT odprowadzany do US)
        </p>
      </div>

      {/* Expense breakdown */}
      {catList.length > 0 ? (
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
          <p className="text-[13px] font-semibold text-white mb-4">Koszty wg kategorii (all time)</p>
          <div className="space-y-3">
            {catList.map(([cat, amount]) => {
              const pct = Math.round((amount / expenses.reduce((s, e) => s + e.grossAmount, 0)) * 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-white/60">{cat}</span>
                    <span className="text-white font-semibold">{formatPLN(amount)} <span className="text-white/35">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full">
                    <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-8 flex flex-col items-center justify-center gap-3">
          <DollarSign size={28} className="text-white/15" />
          <p className="text-[14px] font-semibold text-white/40">Brak danych finansowych</p>
          <p className="text-[12px] text-white/25 text-center leading-relaxed max-w-xs">
            Wgraj fakturę lub dodaj ręcznie przychody i koszty aby zobaczyć raport P&L.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Income Tab ───────────────────────────────────────────────────────────────

function IncomeTab({
  incomes, onAdd, onDelete, onInvoice,
}: {
  incomes: IncomeEntry[]
  onAdd: (e: IncomeEntry) => void
  onDelete: (id: string) => void
  onInvoice: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const paid    = incomes.filter(i => i.status === 'opłacona').reduce((s, i) => s + i.netProfit, 0)
  const pending = incomes.filter(i => i.status === 'oczekująca').reduce((s, i) => s + i.netProfit, 0)
  const overdue = incomes.filter(i => i.status === 'zaległa').reduce((s, i) => s + i.netProfit, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Zysk opłacony',    value: paid,    color: '#22c55e' },
          { label: 'Zysk oczekujący',  value: pending, color: '#f59e0b' },
          { label: 'Zaległe należności', value: overdue, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-[#16213E] border border-white/[0.07] rounded-[12px] p-4 flex sm:block items-center justify-between">
            <p className="text-[11px] text-white/40">{s.label}</p>
            <p className="text-[18px] font-bold sm:mt-0.5" style={{ color: s.color }}>{formatPLN(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-white">Przychody ({incomes.length})</p>
          <div className="flex items-center gap-2">
            <button onClick={onInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/20 transition-all">
              <Upload size={12} /> Wgraj fakturę
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.09] text-white/55 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
              <Plus size={12} /> Dodaj ręcznie
            </button>
          </div>
        </div>

        {incomes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-white/30">Brak przychodów — wgraj fakturę lub dodaj ręcznie</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {incomes.map(inc => {
              const sc = INCOME_STATUS_CONFIG[inc.status]
              const StatusIcon = sc.icon
              return (
                <div key={inc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-white truncate">{inc.client}</p>
                      {inc.fromInvoice && <Receipt size={10} className="text-[#6366f1] flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-white/40 truncate">{inc.project} {inc.invoiceNumber ? `· ${inc.invoiceNumber}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold text-green-400">{formatPLN(inc.netProfit)}</p>
                    <p className="text-[10px] text-white/30">
                      {inc.vatRate === 0 ? 'VAT 0%' : `netto ${formatPLN(inc.amount)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StatusIcon size={12} className={sc.color} />
                    <span className={`text-[10px] font-semibold hidden sm:block ${sc.color}`}>{sc.label}</span>
                  </div>
                  <span className="text-[10px] text-white/30 hidden md:block flex-shrink-0">{formatDate(inc.date)}</span>
                  <button onClick={() => onDelete(inc.id)} className="p-1 rounded text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {showAdd && <AddIncomeModal onClose={() => setShowAdd(false)} onAdd={e => { onAdd(e); toast.success('Przychód dodany') }} />}
    </div>
  )
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

function ExpensesTab({
  expenses, onAdd, onDelete, onInvoice,
}: {
  expenses: ExpenseEntry[]
  onAdd: (e: ExpenseEntry) => void
  onDelete: (id: string) => void
  onInvoice: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const totalGross   = expenses.reduce((s, e) => s + e.grossAmount, 0)
  const totalNet     = expenses.reduce((s, e) => s + e.amount, 0)
  const recurring    = expenses.filter(e => e.recurring).reduce((s, e) => s + e.grossAmount, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Suma brutto (koszty)',  value: totalGross, color: '#ef4444' },
          { label: 'Suma netto (koszty)',   value: totalNet,   color: '#f97316' },
          { label: 'Koszty stałe/miesiąc', value: recurring,  color: '#6366f1' },
        ].map(s => (
          <div key={s.label} className="bg-[#16213E] border border-white/[0.07] rounded-[12px] p-4 flex sm:block items-center justify-between">
            <p className="text-[11px] text-white/40">{s.label}</p>
            <p className="text-[18px] font-bold sm:mt-0.5" style={{ color: s.color }}>{formatPLN(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-white">Koszty ({expenses.length})</p>
          <div className="flex items-center gap-2">
            <button onClick={onInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/20 transition-all">
              <Upload size={12} /> Wgraj fakturę
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.09] text-white/55 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
              <Plus size={12} /> Dodaj ręcznie
            </button>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-white/30">Brak kosztów — wgraj fakturę lub dodaj ręcznie</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {expenses.map(exp => (
              <div key={exp.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-medium text-white/80 truncate">{exp.name}</p>
                    {exp.fromInvoice && <Receipt size={10} className="text-[#6366f1] flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-white/35">{exp.category} {exp.invoiceNumber ? `· ${exp.invoiceNumber}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[12px] font-semibold text-red-400">{formatPLN(exp.grossAmount)}</p>
                  <p className="text-[10px] text-white/30">netto {formatPLN(exp.amount)}</p>
                </div>
                <span className={`text-[10px] font-semibold flex-shrink-0 ${exp.recurring ? 'text-[#6366f1]' : 'text-white/30'}`}>
                  {exp.recurring ? 'Cykliczny' : 'Jednorazowy'}
                </span>
                <span className="text-[11px] text-white/35 hidden lg:block flex-shrink-0">{formatDate(exp.date)}</span>
                <button onClick={() => onDelete(exp.id)} className="p-1 rounded text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onAdd={e => { onAdd(e); toast.success('Koszt dodany') }} />}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [tab, setTab]           = useState<Tab>('overview')
  const [incomes, setIncomes]   = useState<IncomeEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [showInvoice, setShowInvoice] = useState(false)

  useEffect(() => {
    if (isDemoMode()) {
      setIncomes(DEMO_INCOMES as unknown as IncomeEntry[])
      setExpenses(DEMO_EXPENSES as unknown as ExpenseEntry[])
      return
    }
    const supabase = createClient()
    const load = async () => {
      const [{ data: inc }, { data: exp }] = await Promise.all([
        supabase.from('app_income').select('*').order('date', { ascending: false }),
        supabase.from('app_expenses').select('*').order('date', { ascending: false }),
      ])
      if (inc) setIncomes(inc.map(r => dbToIncome(r as Record<string, unknown>)))
      if (exp) setExpenses(exp.map(r => dbToExpense(r as Record<string, unknown>)))
    }
    load()
  }, [])

  const addIncome = useCallback(async (e: IncomeEntry) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('app_income').insert({
      client: e.client,
      project: e.project,
      amount: e.amount,
      vat_rate: e.vatRate,
      vat_amount: e.vatAmount,
      gross_amount: e.grossAmount,
      net_profit: e.netProfit,
      type: e.type,
      status: e.status,
      date: e.date,
      invoice_number: e.invoiceNumber ?? null,
      from_invoice: e.fromInvoice ?? false,
    }).select().single()
    if (!error && data) {
      setIncomes(prev => [dbToIncome(data as Record<string, unknown>), ...prev])
    }
  }, [])

  const addExpense = useCallback(async (e: ExpenseEntry) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('app_expenses').insert({
      name: e.name,
      category: e.category,
      amount: e.amount,
      vat_rate: e.vatRate,
      vat_amount: e.vatAmount,
      gross_amount: e.grossAmount,
      recurring: e.recurring,
      date: e.date,
      invoice_number: e.invoiceNumber ?? null,
      from_invoice: e.fromInvoice ?? false,
    }).select().single()
    if (!error && data) {
      setExpenses(prev => [dbToExpense(data as Record<string, unknown>), ...prev])
    }
  }, [])

  const deleteIncome = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('app_income').delete().eq('id', id)
    setIncomes(prev => prev.filter(i => i.id !== id))
    toast.success('Usunięto')
  }, [])

  const deleteExpense = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('app_expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    toast.success('Usunięto')
  }, [])

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Przegląd P&L' },
    { id: 'income',    label: 'Przychody' },
    { id: 'expenses',  label: 'Koszty' },
  ]

  return (
    <div className="max-w-[1200px] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-white">Finanse</h1>
          <p className="text-[12px] text-white/40 mt-0.5">Tracker P&L — przychody, koszty, VAT</p>
        </div>
        <button
          onClick={() => setShowInvoice(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] text-white text-[13px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Receipt size={14} /> Dodaj fakturę
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-[10px] border border-white/[0.07] w-full sm:w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all ${tab === t.id ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-500/20' : 'text-white/50 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab incomes={incomes} expenses={expenses} />}
      {tab === 'income'   && <IncomeTab incomes={incomes} onAdd={addIncome} onDelete={deleteIncome} onInvoice={() => setShowInvoice(true)} />}
      {tab === 'expenses' && <ExpensesTab expenses={expenses} onAdd={addExpense} onDelete={deleteExpense} onInvoice={() => setShowInvoice(true)} />}

      {showInvoice && (
        <InvoiceUploadModal
          onClose={() => setShowInvoice(false)}
          onAddIncome={e => { addIncome(e); setTab('income') }}
          onAddExpense={e => { addExpense(e); setTab('expenses') }}
        />
      )}
    </div>
  )
}
