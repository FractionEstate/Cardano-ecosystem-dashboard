"use client"

import { useState } from "react"
import type { KPI } from "@/types/kpi"

type KpiFilterProps = {
  kpis: KPI[]
  onFilterChange: (filteredKpis: KPI[]) => void
}

export function KpiFilter({ kpis, onFilterChange }: KpiFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    const filteredKpis = category === "all" ? kpis : kpis.filter((kpi) => kpi.category === category)
    onFilterChange(filteredKpis)
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Filter by Category:</h3>
      <div className="flex space-x-2">
        {["all", "user", "developer", "liquidity"].map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-3 py-1 rounded ${
              selectedCategory === category ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

