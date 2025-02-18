import { NextResponse } from "next/server"
import { fetchAllKPIs } from "@/lib/api"

function convertToCSV(kpis: any[]) {
  const header = Object.keys(kpis[0]).join(",") + "\n"
  const rows = kpis.map((kpi) => Object.values(kpi).join(",")).join("\n")
  return header + rows
}

export async function GET() {
  const kpis = await fetchAllKPIs()
  const csv = convertToCSV(kpis)
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=kpi_data.csv",
    },
  })
}

