import type { KPI } from "@/types/kpi"
import { KpiCard } from "./KpiCard"

export function DataGrid({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  )
}

