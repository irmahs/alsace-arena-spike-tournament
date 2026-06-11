import { getRanks } from "@/services/rank";

export default async function Home() {
  const { rows, error } = await getRanks();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h2 className="text-xl font-semibold mb-4">Rank</h2>

      {error ? (
        <p className="text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">No rank data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
                  ID
                </th>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
                  Rank Name
                </th>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
                  Rank Value
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b border-gray-200 text-sm">
                    {row.id}
                  </td>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm">
                    {row.rank_name}
                  </td>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm">
                    {row.rank_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
