'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

interface PLChartProps {
  data: { month: string; revenue: number; costs: number; profit: number }[]
  target?: number
}

export function PLChart({ data, target }: PLChartProps) {
  return (
    <div className="bg-card border border-white/[0.07] rounded-[14px] p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[13px] font-semibold text-white">P&L — ostatnie miesiące</p>
        {target && (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
            <span className="inline-block w-4 border-t border-dashed border-amber-400" />
            Cel {(target / 1000).toFixed(0)}k PLN
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1 text-[11px] text-white/40"><span className="w-2.5 h-2.5 rounded-sm bg-[#6366f1] inline-block" />Przychód</span>
        <span className="flex items-center gap-1 text-[11px] text-white/40"><span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444] inline-block" />Koszty</span>
        <span className="flex items-center gap-1 text-[11px] text-white/40"><span className="w-4 border-t-2 border-[#22c55e] inline-block" />Zysk</span>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#16213E',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
            formatter={(value, name) => [
              `${Number(value).toLocaleString('pl-PL')} PLN`,
              name === 'revenue' ? 'Przychód' : name === 'costs' ? 'Koszty' : 'Zysk',
            ]}
          />
          {target && (
            <ReferenceLine
              y={target}
              stroke="#f59e0b"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{ value: `Cel ${(target / 1000).toFixed(0)}k`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight', dy: -6 }}
            />
          )}
          <Bar dataKey="revenue" name="revenue" fill="#6366f1" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={22} />
          <Bar dataKey="costs"   name="costs"   fill="#ef4444" fillOpacity={0.75} radius={[3, 3, 0, 0]} maxBarSize={22} />
          <Line dataKey="profit" name="profit" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
