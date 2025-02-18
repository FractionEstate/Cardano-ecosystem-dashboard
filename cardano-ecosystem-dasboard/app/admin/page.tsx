import { fetchAllKPIs } from "@/lib/api"
import Link from "next/link"

export default async function AdminDashboard() {
  const kpis = await fetchAllKPIs()

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">ID</th>
            <th className="text-left">Title</th>
            <th className="text-left">Value</th>
            <th className="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {kpis.map((kpi) => (
            <tr key={kpi.id}>
              <td>{kpi.id}</td>
              <td>{kpi.title}</td>
              <td>{kpi.value}</td>
              <td>
                <Link href={`/admin/edit/${kpi.id}`} className="text-blue-600 hover:underline">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

