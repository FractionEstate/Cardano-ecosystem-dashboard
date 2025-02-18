import { BlockFrostAPI } from "@blockfrost/blockfrost-js"
import type { KPI } from "../types/kpi"
import { cache } from "react"

const blockfrostApi = new BlockFrostAPI({
  projectId: process.env.BLOCKFROST_PROJECT_ID || "",
})

const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    "x-auth-token": token || "",
  }
  const response = await fetch(url, { ...options, headers })
  if (response.status === 401) {
    // Handle unauthorized access (e.g., redirect to login page)
    throw new Error("Unauthorized")
  }
  return response
}

export const fetchKPI = cache(async (slug: string): Promise<KPI> => {
  switch (slug) {
    case "tvl":
      const totalLovelace = await blockfrostApi.epochsLatestParameters()
      const tvl = Number.parseInt(totalLovelace.e_max) / 1000000 // Convert lovelace to ADA
      return {
        id: "tvl",
        title: "Total Value Locked",
        value: `$${tvl.toFixed(2)}M`,
        change: 0,
        category: "liquidity",
        data: [],
      }
    case "active_addresses":
      const latestEpoch = await blockfrostApi.epochsLatest()
      return {
        id: "active_addresses",
        title: "Active Addresses",
        value: latestEpoch.active_stake.toString(),
        change: 0,
        category: "user",
        data: [],
      }
    case "transactions":
      const latestBlock = await blockfrostApi.blocksLatest()
      return {
        id: "transactions",
        title: "Daily Transactions",
        value: latestBlock.transactions.toString(),
        change: 0,
        category: "developer",
        data: [],
      }
    default:
      // Fetch from backend API
      const response = await fetchWithAuth(`${backendApiUrl}/api/kpis/${slug}`)
      if (!response.ok) {
        throw new Error("KPI not found")
      }
      return await response.json()
  }
})

export const fetchAllKPIs = cache(async (): Promise<KPI[]> => {
  const [tvl, activeAddresses, transactions] = await Promise.all([
    fetchKPI("tvl"),
    fetchKPI("active_addresses"),
    fetchKPI("transactions"),
  ])

  // Fetch additional KPIs from backend API
  const response = await fetchWithAuth(`${backendApiUrl}/api/kpis`)
  const additionalKPIs = await response.json()

  return [tvl, activeAddresses, transactions, ...additionalKPIs]
})

export async function updateKPI(id: string, updates: Partial<KPI>): Promise<KPI> {
  const response = await fetchWithAuth(`${backendApiUrl}/api/kpis/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error("Failed to update KPI")
  }

  return await response.json()
}

export async function createKPI(kpi: Omit<KPI, "id">): Promise<KPI> {
  const response = await fetchWithAuth(`${backendApiUrl}/api/kpis`, {
    method: "POST",
    body: JSON.stringify(kpi),
  })

  if (!response.ok) {
    throw new Error("Failed to create KPI")
  }

  return await response.json()
}

export async function deleteKPI(id: string): Promise<void> {
  const response = await fetchWithAuth(`${backendApiUrl}/api/kpis/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete KPI")
  }
}

