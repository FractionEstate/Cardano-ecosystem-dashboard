"use client"

import { LineChart as RechartLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface LineChartProps {
  data: { date: string; value: number }[]
  detailed?: boolean
}

/**
 * LineChart component renders a line chart for KPI data
 * @param data - Array of data points to display in the chart
 * @param detailed - Whether to show a detailed view of the chart
 */
export function LineChart({ data, detailed = false }: LineChartProps) {
  return (
    <div className={detailed ? "h-[400px]" : "h-[200px]"}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartLineChart data={data}>
          <XAxis
            dataKey="date"
            hide={!detailed}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
            stroke="#888888"
          />
          {detailed && <YAxis stroke="#888888" />}
          <Tooltip
            contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333" }}
            labelStyle={{ color: "#888888" }}
            itemStyle={{ color: "#FFD700" }}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#FFD700"
            strokeWidth={2}
            dot={detailed}
            activeDot={{ r: 8, fill: "#007AFF" }}
          />
        </RechartLineChart>
      </ResponsiveContainer>
    </div>
  )
}

