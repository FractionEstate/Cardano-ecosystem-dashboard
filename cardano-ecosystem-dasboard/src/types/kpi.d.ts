export interface KPI {
  id: string
  title: string
  value: string | number
  change: number
  category: "user" | "developer" | "liquidity"
  data: { date: string; value: number }[]
}

