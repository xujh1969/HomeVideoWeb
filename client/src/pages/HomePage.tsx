import { useState, useEffect, useMemo } from 'react'
import { getHomeData, getMovies, getSeries, getRecentlyWatched } from '@/utils/api'
import type { HomePageData, MediaCardData, Movie, Series, WatchHistoryItem } from '@shared/types'
import { VideoCarousel } from '@/components/home/VideoCarousel'
import { RecentlyWatched } from '@/components/home/RecentlyWatched'
import { MediaGrid } from '@/components/movie/MediaGrid'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'

interface HomePageProps {
  selectedGenre?: string
  selectedSection?: string
  searchQuery?: string
}

const PAGE_SIZE = 24

export default function HomePage({ selectedGenre = '全部', selectedSection = 'home', searchQuery = '' }: HomePageProps) {
  const [data, setData] = useState<HomePageData | null>(null)
  const [recentlyWatched, setRecentlyWatched] = useState<WatchHistoryItem[]>([])
  const [allMovies, setAllMovies] = useState<Movie[]>([])
  const [allSeries, setAllSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSection])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedGenre])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (selectedSection === 'home') {
          const [homeResult, watchedResult] = await Promise.all([
            getHomeData(1, 1000),
            getRecentlyWatched()
          ])
          setData(homeResult)
          setRecentlyWatched(watchedResult)
        } else if (selectedSection === 'movies') {
          const result = await getMovies({ limit: 1000 })
          setAllMovies(result.movies)
        } else if (selectedSection === 'series') {
          const result = await getSeries({ limit: 1000 })
          setAllSeries(result.series)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('获取数据失败，请刷新重试')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedSection])

  const allItems = useMemo(() => {
    if (selectedSection === 'home' && data) {
      return data.library.items
    }
    if (selectedSection === 'movies') {
      return allMovies as unknown as MediaCardData[]
    }
    if (selectedSection === 'series') {
      return allSeries as unknown as MediaCardData[]
    }
    return []
  }, [data, allMovies, allSeries, selectedSection])

  const filteredItems = useMemo(() => {
    let items = allItems

    if (selectedGenre !== '全部') {
      items = items.filter((item: MediaCardData) => item.filename_genre === selectedGenre)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      items = items.filter((item: MediaCardData) => {
        const titleCn = (item.title_cn || '').toLowerCase()
        const titleEn = (item.title_en || '').toLowerCase()
        return titleCn.includes(query) || titleEn.includes(query)
      })
    }

    return items
  }, [allItems, selectedGenre, searchQuery])

  const sortedItems = useMemo(() => {
    const bestRating = (item: MediaCardData) => item.imdb_rating || item.douban_rating || item.filename_rating
    return [...filteredItems].sort((a, b) => {
      const ra = bestRating(a) ?? 0
      const rb = bestRating(b) ?? 0
      return sortDesc ? rb - ra : ra - rb
    })
  }, [filteredItems, sortDesc])

  const displayItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedItems.slice(start, start + PAGE_SIZE)
  }, [sortedItems, currentPage])

  const totalPages = useMemo(() => {
    return Math.ceil(sortedItems.length / PAGE_SIZE)
  }, [sortedItems.length])

  const pageTitle = useMemo(() => {
    if (selectedGenre !== '全部') {
      return selectedGenre
    }
    if (selectedSection === 'movies') return '电影库'
    if (selectedSection === 'series') return '连续剧'
    return '影片库'
  }, [selectedSection, selectedGenre])

  const showHero = selectedSection === 'home' && selectedGenre === '全部' && !searchQuery
  
  // 从电影库中随机选择5部用于轮播
  const carouselMovies = useMemo(() => {
    if (!data || !data.library.items || data.library.items.length === 0) return []
    // 获取所有有完整信息的电影
    const allItems = [...data.library.items]
    // 随机打乱并取前5部
    const shuffled = allItems.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 5) as unknown as Movie[]
  }, [data])

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState title="加载失败" description={error} />
      </div>
    )
  }

  if (selectedSection === 'home' && !data) {
    return (
      <div className="p-6">
        <EmptyState title="暂无数据" description="请先添加电影源" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showHero && (
        <VideoCarousel movies={carouselMovies} />
      )}

      {showHero && (
        <RecentlyWatched items={recentlyWatched} />
      )}

      {displayItems.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display-sm text-ink font-medium">{pageTitle}</h2>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="flex flex-col items-center px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
              title={sortDesc ? '切换为升序' : '切换为降序'}
            >
              <svg width="14" height="9" viewBox="0 0 14 9" className={`${sortDesc ? 'text-ink-dim' : 'text-primary'} transition-colors`}>
                <polygon points="7,0 14,9 0,9" fill="currentColor" />
              </svg>
              <svg width="14" height="9" viewBox="0 0 14 9" className={`-mt-0.5 ${sortDesc ? 'text-primary' : 'text-ink-dim'} transition-colors`}>
                <polygon points="7,9 14,0 0,0" fill="currentColor" />
              </svg>
            </button>
          </div>
          <MediaGrid items={displayItems} title="" />
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {displayItems.length === 0 && (
        <EmptyState
          title={searchQuery ? '未找到匹配影片' : '暂无数据'}
          description={
            searchQuery
              ? `未找到包含"${searchQuery}"的影片，请尝试其他关键词`
              : selectedGenre !== '全部'
              ? `暂无${selectedGenre}分类的影片`
              : '暂无影片数据'
          }
        />
      )}
    </div>
  )
}