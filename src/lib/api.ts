import { BlockFrostAPI } from "@blockfrost/blockfrost-js"
import type { KPI } from "../types/kpi"
import { cache } from "react"

if (!process.env.BLOCKFROST_PROJECT_ID) {
  throw new Error("BLOCKFROST_PROJECT_ID is not set in the environment variables")
}

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set in the environment variables")
}

/**
 * BlockFrost API instance for interacting with the Cardano blockchain
 */
const blockfrostApi = new BlockFrostAPI({
  projectId: process.env.BLOCKFROST_PROJECT_ID,
})

/**
 * Base URL for the backend API
 */
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL

/**
 * Fetches data from the API with authentication
 * @param url - The URL to fetch from
 * @param options - Additional fetch options
 * @returns Promise<Response>
 * @throws Error if the request is unauthorized or fails
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token")
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    "x-auth-token": token || "",
  }
  const response = await fetch(url, { ...options, headers })
  if (response.status === 401) {
    throw new Error("Unauthorized: Please log in to access this resource")
  }
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }
  return response
}

/**
 * Fetches a specific KPI by its slug
 * @param slug - The unique identifier for the KPI
 * @returns Promise<KPI>
 * @throws Error if the KPI is not found or if there's an API error
 */
export const fetchKPI = cache(async (slug: string): Promise<KPI> => {
  try {
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
        return await response.json()
    }
  } catch (error) {
    console.error(`Error fetching KPI ${slug}:`, error)
    throw new Error(`Failed to fetch KPI: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
})

/**
 * Fetches all KPIs
 * @returns Promise<KPI[]>
 * @throws Error if there's an API error
 */
export const fetchAllKPIs = cache(async (): Promise<KPI[]> => {
  try {
    const [tvl, activeAddresses, transactions] = await Promise.all([
      fetchKPI("tvl"),
      fetchKPI("active_addresses"),
      fetchKPI("transactions"),
    ])

    // Fetch additional KPIs from backend API
    const response = await fetchWithAuth(`${backendApiUrl}/api/kpis`)
    const additionalKPIs = await response.json()

    return [tvl, activeAddresses, transactions, ...additionalKPIs]
  } catch (error) {
    console.error("Error fetching all KPIs:", error)
    throw new Error(`Failed to fetch all KPIs: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
})

/**
 * Updates a specific KPI
 * @param id - The ID of the KPI to update
 * @param updates - The updates to apply to the KPI
 * @returns Promise<KPI>
 * @throws Error if there's an API error
 */
export async function updateKPI(id: string, updates: Partial<KPI>): Promise<KPI> {
  try {
    const response = await fetchWithAuth(`${backendApiUrl}/api/kpis/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
    return await response.json()
  } catch (error) {
    console.error(`Error updating KPI ${id}:`, error)
    throw new Error(`Failed to update KPI: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Creates a new KPI
 * @param kpi - The KPI data to create
 * @returns Promise<KPI>
 * @throws Error if there's an API error
 */
export async function createKPI(kpi: Omit<KPI, "id">): Promise<KPI> {
  try {
    const response = await fetchWithAuth(`${backendApiUrl}/api/kpis`, {
      method: "POST",
      body: JSON.stringify(kpi),
    })
    return await response.json()
  } catch (error) {
    console.error("Error creating KPI:", error)
    throw new Error(`Failed to create KPI: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Deletes a specific KPI
 * @param id - The ID of the KPI to delete
 * @throws Error if there's an API error
 */
export async function deleteKPI(id: string): Promise<void> {
  try {
    await fetchWithAuth(`${backendApiUrl}/api/kpis/${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    console.error(`Error deleting KPI ${id}:`, error)
    throw new Error(`Failed to delete KPI: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

