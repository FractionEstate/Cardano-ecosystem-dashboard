import Link from "next/link"
import type { KPI } from "@/types/kpi"
import { LineChart } from "./LineChart"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface KpiCardProps {
  kpi: KPI
}

/**
 * KpiCard component displays a single KPI in a card format
 * @param kpi - The KPI data to display
 */
export function KpiCard({ kpi }: KpiCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="border-b border-border/40 bg-muted/40">
        <CardTitle className="text-lg font-medium">{kpi.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="text-2xl font-bold text-gold">{kpi.value}</div>
          <Badge variant={kpi.change >= 0 ? "default" : "destructive"} className="text-xs">
            {kpi.change >= 0 ? <ArrowUpIcon className="mr-1 h-3 w-3" /> : <ArrowDownIcon className="mr-1 h-3 w-3" />}
            {Math.abs(kpi.change)}%
          </Badge>
        </div>
        <LineChart data={kpi.data} />
      </CardContent>
      <CardFooter className="bg-muted/40 p-4">
        <Link href={`/${kpi.id}`} className="text-sm font-medium text-blue-accent hover:underline">
          View Details →
        </Link>
      </CardFooter>
    </Card>
  )
}

