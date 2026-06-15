import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Film, Tv, Home } from 'lucide-react'
import { getGenreStats } from '@/utils/api'

interface SidebarProps {
  selectedGenre?: string
  selectedSection?: string
  onGenreSelect?: (genre: string) => void
  onSectionSelect?: (section: string) => void
}

interface GenreCount {
  [key: string]: number
}

export function Sidebar({ selectedGenre = '全部', selectedSection = 'home', onGenreSelect, onSectionSelect }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [movieGenreCounts, setMovieGenreCounts] = useState<GenreCount>({})
  const [seriesGenreCounts, setSeriesGenreCounts] = useState<GenreCount>({})
  const [seriesCount, setSeriesCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // 检查是否在详情页
  const isDetailPage = location.pathname.startsWith('/movie/') || location.pathname.startsWith('/series/')

  // 点击主导航按钮时，如果当前在详情页则导航到首页
  const handleSectionClick = (section: string) => {
    if (isDetailPage) {
      navigate('/')
    }
    onSectionSelect?.(section)
    onGenreSelect?.('全部')
  }

  // 点击分类按钮时，如果当前在详情页则导航到首页
  const handleGenreClick = (genre: string) => {
    if (isDetailPage) {
      navigate('/')
    }
    onGenreSelect?.(genre)
  }

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // 使用新的统计API，只获取分类统计数据，不加载所有电影
        const stats = await getGenreStats()
        
        setMovieGenreCounts(stats.movieGenres)
        setSeriesGenreCounts(stats.seriesGenres)
        setTotalCount(stats.movieTotal)
        setSeriesCount(stats.seriesTotal)
      } catch (error) {
        console.error('Failed to fetch sidebar counts:', error)
      }
    }
    fetchCounts()
  }, [])

  // 根据当前 section 显示不同的分类统计
  const currentGenreCounts = selectedSection === 'series' ? seriesGenreCounts : movieGenreCounts
  const currentTotal = selectedSection === 'series' ? seriesCount : totalCount

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 bg-surface/50 backdrop-blur-md z-40 overflow-y-auto">
      <nav className="p-4 h-full">
        <div className="space-y-2 mb-6">
          <button
            onClick={() => handleSectionClick('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-left transition-all ${
              selectedSection === 'home'
                ? 'bg-gradient-to-r from-primary to-primary-light text-ink font-semibold hover:shadow-glow-primary'
                : 'hover:bg-surface-elevated text-ink-muted hover:text-ink'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="flex-1 text-left">首页</span>
          </button>
          <button
            onClick={() => handleSectionClick('movies')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-left transition-all ${
              selectedSection === 'movies'
                ? 'bg-gradient-to-r from-primary to-primary-light text-ink font-semibold hover:shadow-glow-primary'
                : 'hover:bg-surface-elevated text-ink-muted hover:text-ink'
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="flex-1 text-left">电影库</span>
            {totalCount > 0 && (
              <span className="text-caption text-ink-dim">{totalCount}</span>
            )}
          </button>
          <button
            onClick={() => handleSectionClick('series')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-left transition-all ${
              selectedSection === 'series'
                ? 'bg-gradient-to-r from-primary to-primary-light text-ink font-semibold hover:shadow-glow-primary'
                : 'hover:bg-surface-elevated text-ink-muted hover:text-ink'
            }`}
          >
            <Tv className="w-5 h-5" />
            <span className="flex-1 text-left">连续剧</span>
            {seriesCount > 0 && (
              <span className="text-caption text-ink-dim">{seriesCount}</span>
            )}
          </button>
        </div>
        
        <div className="pt-4">
          <h3 className="px-3 py-2 text-caption text-ink-dim uppercase tracking-wider">分类</h3>
          <div className="space-y-1 mt-2 pb-4">
            <button
              onClick={() => handleGenreClick('全部')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-left transition-all ${
                selectedGenre === '全部'
                  ? 'bg-surface-elevated text-ink font-medium'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-elevated'
              }`}
            >
              <span className="text-body-sm">全部</span>
              <span className="text-caption text-ink-dim">
                {currentTotal || ''}
              </span>
            </button>
            
            {Object.entries(currentGenreCounts || {})
              .sort((a, b) => b[1] - a[1])
              .map(([genre, count]) => (
                <button
                  key={genre}
                  onClick={() => handleGenreClick(genre)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-left transition-all ${
                    selectedGenre === genre
                      ? 'bg-surface-elevated text-ink font-medium'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <span className="text-body-sm">{genre}</span>
                  <span className="text-caption text-ink-dim">{count}</span>
                </button>
              ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}
