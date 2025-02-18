import { fetchKPI } from "../../lib/api"
import { LineChart } from "../components/LineChart"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface KpiDetailProps {
  params: { slug: string }
}

/**
 * KpiDetail page displays detailed information about a specific KPI
 * @param params - Object containing the slug of the KPI to display
 */
export default async function KpiDetail({ params }: KpiDetailProps) {
  const kpi = await fetchKPI(params.slug)

  return (
    <div className="space-y-8">  {\
  const kpi = await fetchKPI(params.slug)

  return (
    <div className="space-y-8">
      <Link href="/" className="text-blue-accent hover:underline">
        ← Back to Dashboard
      </Link>
      <Card>
        <CardHeader className="border-b border-border/40 bg-muted/40">
          <CardTitle className="text-2xl font-bold text-gold">{kpi.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 flex items-baseline justify-between">
            <div className="text-4xl font-bold text-gold">{kpi.value}</div>
            <Badge variant={kpi.change >= 0 ? "default" : "destructive"} className="text-sm">
              {kpi.change >= 0 ? <ArrowUpIcon className="mr-1 h-4 w-4" /> : <ArrowDownIcon className="mr-1 h-4 w-4" />}
              {Math.abs(kpi.change)}%
            </Badge>
          </div>
          <div className="h-[400px]">
            <LineChart data={kpi.data} detailed />
          </div>
          <div className="mt-6 space-y-4">
            <p className="text-muted-foreground">Category: <span className="text-foreground">{kpi.category}</span></p>
            <p className="text-muted-foreground">30-day change: <span className="text-foreground">{kpi.change}%</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

