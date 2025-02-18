"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchKPI, updateKPI } from "@/lib/api"
import type { KPI } from "@/types/kpi"
import Link from "next/link"

export default function EditKPI({ params }: { params: { id: string } }) {
  const [kpi, setKpi] = useState<KPI | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchKPI(params.id).then(setKpi)
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!kpi) return

    const formData = new FormData(e.currentTarget)
    const updates = {
      title: formData.get("title") as string,
      value: formData.get("value") as string,
      change: Number.parseFloat(formData.get("change") as string),
      category: formData.get("category") as KPI["category"],
    }

    await updateKPI(kpi.id, updates)
    router.push("/admin")
  }

  if (!kpi) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Admin Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-6">Edit KPI: {kpi.title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-1">
            Title
          </label>
          <input type="text" id="title" name="title" defaultValue={kpi.title} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label htmlFor="value" className="block mb-1">
            Value
          </label>
          <input type="text" id="value" name="value" defaultValue={kpi.value} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label htmlFor="change" className="block mb-1">
            Change (%)
          </label>
          <input
            type="number"
            id="change"
            name="change"
            defaultValue={kpi.change}
            step="0.1"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="category" className="block mb-1">
            Category
          </label>
          <select id="category" name="category" defaultValue={kpi.category} className="w-full p-2 border rounded">
            <option value="user">User</option>
            <option value="developer">Developer</option>
            <option value="liquidity">Liquidity</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update KPI
        </button>
      </form>
    </div>
  )
}

