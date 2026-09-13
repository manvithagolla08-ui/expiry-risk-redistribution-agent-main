import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState<any>(null)
  const [stats, setStats] = useState({ warehouses: 0, products: 0, inventory: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check health
    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => setError(err.message))

    // Check stats (Phase 2 connection test)
    Promise.all([
      fetch('http://localhost:8000/api/warehouses').then(res => res.json()),
      fetch('http://localhost:8000/api/products').then(res => res.json()),
      fetch('http://localhost:8000/api/inventory').then(res => res.json())
    ])
    .then(([warehouses, products, inventory]) => {
      setStats({
        warehouses: warehouses.length || 0,
        products: products.length || 0,
        inventory: inventory.length || 0
      })
    })
    .catch(err => {
      console.error("Error fetching data:", err)
      // We don't overwrite the main error if the db just isn't seeded yet
    })

  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">SH-204 Expiry Risk Agent</h1>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-2">Backend Health Status</h2>
            {error ? (
              <p className="text-red-600 bg-red-50 p-2 rounded border border-red-100 text-sm">{error}</p>
            ) : health ? (
              <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                {JSON.stringify(health, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500 text-sm">Checking connection...</p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-green-50 border border-green-100">
             <h2 className="text-sm font-semibold text-green-800 uppercase tracking-wider mb-2">Database Stats</h2>
             <ul className="text-sm text-gray-700 space-y-1">
               <li><strong>Warehouses:</strong> {stats.warehouses}</li>
               <li><strong>Products:</strong> {stats.products}</li>
               <li><strong>Inventory Batches:</strong> {stats.inventory}</li>
             </ul>
             <p className="text-xs text-gray-500 mt-2">
               If numbers are 0, make sure to run the SQL schema in Supabase, configure .env, and run seed.py.
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
