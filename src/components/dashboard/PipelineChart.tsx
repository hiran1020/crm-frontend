import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '@/context/ThemeContext'
import type { PipelineStageSummary } from '@/types/dashboard'
import { formatCurrency } from '@/lib/format'

interface PipelineChartProps {
  data: PipelineStageSummary[]
}

export function PipelineChart({ data }: PipelineChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const gridColor   = isDark ? '#2d4060' : '#e2e8f0'
  const axisColor   = isDark ? '#475569' : '#94a3b8'
  const tooltipBg   = isDark ? '#0f1f35' : '#fff'
  const tooltipBorder = isDark ? '#2d4060' : '#e2e8f0'
  const tooltipText = isDark ? '#e2e8f0' : '#0f172a'

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={gridColor}
          />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 12, fill: axisColor }}
            stroke={axisColor}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: axisColor }}
            stroke={axisColor}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Value']}
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              color: tooltipText,
              borderRadius: '6px',
            }}
          />
          <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
