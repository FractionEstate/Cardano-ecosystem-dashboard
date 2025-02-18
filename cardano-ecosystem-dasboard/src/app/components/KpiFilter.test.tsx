import { render, fireEvent } from "@testing-library/react"
import { KpiFilter } from "./KpiFilter"
import type { KPI } from "@/types/kpi"
import { describe, it, expect } from "@jest/globals"

const mockKpis: KPI[] = [
  { id: "1", title: "KPI 1", value: "100", change: 5, category: "user", data: [] },
  { id: "2", title: "KPI 2", value: "200", change: -2, category: "developer", data: [] },
  { id: "3", title: "KPI 3", value: "300", change: 0, category: "liquidity", data: [] },
]

describe("KpiFilter", () => {
  it("filters KPIs correctly", () => {
    const onFilterChange = jest.fn()
    const { getByText, getAllByText } = render(<KpiFilter kpis={mockKpis} onFilterChange={onFilterChange} />)

    fireEvent.click(getAllByText("User")[0]) // Use getAllByText to handle multiple elements with the same text
    expect(onFilterChange).toHaveBeenCalledWith([mockKpis[0]])

    fireEvent.click(getAllByText("Developer")[0]) // Use getAllByText to handle multiple elements with the same text
    expect(onFilterChange).toHaveBeenCalledWith([mockKpis[1]])

    fireEvent.click(getAllByText("Liquidity")[0]) // Use getAllByText to handle multiple elements with the same text
    expect(onFilterChange).toHaveBeenCalledWith([mockKpis[2]])

    fireEvent.click(getAllByText("All")[0]) // Use getAllByText to handle multiple elements with the same text
    expect(onFilterChange).toHaveBeenCalledWith(mockKpis)
  })
})

