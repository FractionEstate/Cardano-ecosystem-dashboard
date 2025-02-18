import type { KPI } from "@/types/kpi"

const THRESHOLDS: Record<string, number> = {
  tvl: 1e9, // $1 billion
  active_addresses: 200000,
  transactions: 80000,
}

export function checkThresholds(kpis: KPI[]): string[] {
  return kpis.reduce((alerts: string[], kpi) => {
    const threshold = THRESHOLDS[kpi.id]
    if (threshold && Number.parseFloat(kpi.value.replace(/[^0-9.-]+/g, "")) < threshold) {
      alerts.push(`${kpi.title} is below the threshold of ${threshold.toLocaleString()}`)
    }
    return alerts
  }, [])
}

