"use client"

import { useState, useEffect } from "react"
import type { KPI } from "@/types/kpi"
import { Button } from "@/components/ui/button"

interface FavoriteKPIsProps {
  kpis: KPI[]
  initialFavorites: string[]
}

/**
 * FavoriteKPIs component allows users to mark KPIs as favorites
 * @param kpis - Array of all available KPIs
 * @param initialFavorites - Initial array of favorite KPI IDs (from server-side)
 */
export function FavoriteKPIs({ kpis, initialFavorites }: FavoriteKPIsProps) {
  const [favorites, setFavorites] = useState<string[]>(initialFavorites)

  useEffect(() => {
    // Sync favorites with localStorage
    localStorage.setItem("favoriteKPIs", JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = (id: string) => {
    setFavorites((prevFavorites) =>
      prevFavorites.includes(id) ? prevFavorites.filter((fav) => fav !== id) : [...prevFavorites, id],
    )
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-semibold text-gold">Favorite KPIs</h2>
      <div className="flex flex-wrap gap-2">
        {kpis.map((kpi) => (
          <Button
            key={kpi.id}
            onClick={() => toggleFavorite(kpi.id)}
            variant={favorites.includes(kpi.id) ? "default" : "outline"}
            className="transition-all duration-300 ease-in-out"
          >
            {kpi.title}
          </Button>
        ))}
      </div>
    </div>
  )
}

