import { useEffect, useState } from 'react'

export default function TestPage() {
  const [message, setMessage] = useState('Loading...')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/home')
        const result = await response.json()
        setData(result)
        setMessage(`Success! ${result.library.total} movies found`)
      } catch (error) {
        setMessage(`Error: ${error}`)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-canvas p-8">
      <h1 className="text-2xl text-white mb-4">Test Page</h1>
      <p className="text-gray-400">{message}</p>
      {data && (
        <div className="mt-4">
          <h2 className="text-xl text-white mb-2">Library Items:</h2>
          <div className="grid grid-cols-4 gap-4">
            {data.library.items.slice(0, 8).map((item: any) => (
              <div key={item.id} className="bg-surface p-4 rounded-lg">
                <h3 className="text-white font-semibold">{item.title_cn || item.title_en}</h3>
                <p className="text-gray-400 text-sm">{item.filename_genre}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}