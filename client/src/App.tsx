import { Suspense, lazy, useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { LoadingSpinner } from './components/common/LoadingSpinner'

const HomePage = lazy(() => import('./pages/HomePage'))
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'))
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage'))
const PlayerPage = lazy(() => import('./pages/PlayerPage'))

function App() {
  const [selectedGenre, setSelectedGenre] = useState<string>('全部')
  const [selectedSection, setSelectedSection] = useState<string>('home')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      <Header onSearch={handleSearch} />
      <div className="flex">
        <Sidebar 
          selectedGenre={selectedGenre} 
          selectedSection={selectedSection}
          onGenreSelect={setSelectedGenre} 
          onSectionSelect={setSelectedSection}
        />
        <main className="flex-1 ml-56 pt-16">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage selectedGenre={selectedGenre} selectedSection={selectedSection} searchQuery={searchQuery} />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/series/:id" element={<SeriesDetailPage />} />
              <Route path="/player/:type/:id/:episodeId?" element={<PlayerPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default App