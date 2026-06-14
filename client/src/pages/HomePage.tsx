import { useState, useEffect, useMemo } from 'react'
import { getHomeData, getMovies, getSeries } from '@/utils/api'
import type { HomePageData, MediaCardData, Movie, Series } from '@shared/types'
import { VideoCarousel } from '@/components/home/VideoCarousel'
import { RecentlyWatched } from '@/components/home/RecentlyWatched'
import { MediaGrid } from '@/components/movie/MediaGrid'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'
import { matchSearch } from '@/utils/pinyin'

interface HomePageProps {
  selectedGenre?: string
  selectedSection?: string
  searchQuery?: string
}

const PAGE_SIZE = 24

export default function HomePage({ selectedGenre = '全部', selectedSection = 'home', searchQuery = '' }: HomePageProps) {
  const [data, setData] = useState<HomePageData | null>(null)
  const [allMovies, setAllMovies] = useState<Movie[]>([])
  const [allSeries, setAllSeries] = useState<Series[]>([])
  const [latestMovies, setLatestMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortDesc, setSortDesc] = useState(true)

  // 当 section 变化时，重置页码并重新获取数据
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSection])

  // 当分类变化时，重置页码
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedGenre])

  // 当搜索词变化时，重置页码
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (selectedSection === 'home') {
          const result = await getHomeData(1, 1000)
          setData(result)
          // 获取最近添加的5部电影用于轮播
          const moviesResult = await getMovies({ limit: 5, sort: 'date_desc' })
          setLatestMovies(moviesResult.movies)
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

  // 获取当前 section 的所有数据
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

  // 根据分类筛选数据
  const filteredItems = useMemo(() => {
    let items = allItems

    // 分类筛选
    if (selectedGenre !== '全部') {
      items = items.filter((item: MediaCardData) => item.filename_genre === selectedGenre)
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      items = items.filter((item: MediaCardData) => {
        const titleCn = item.title_cn || ''
        const titleEn = (item.title_en || '').toLowerCase()
        // 使用 matchSearch 支持中文、英文、拼音首字母搜索
        return matchSearch(titleCn, query) || titleEn.includes(query)
      })
    }

    return items
  }, [allItems, selectedGenre, searchQuery])

  // 按评分排序
  const sortedItems = useMemo(() => {
    const bestRating = (item: MediaCardData) => item.imdb_rating || item.douban_rating || item.filename_rating
    return [...filteredItems].sort((a, b) => {
      const ra = bestRating(a) ?? 0
      const rb = bestRating(b) ?? 0
      return sortDesc ? rb - ra : ra - rb
    })
  }, [filteredItems, sortDesc])

  // 分页显示
  const displayItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedItems.slice(start, start + PAGE_SIZE)
  }, [sortedItems, currentPage])

  const totalPages = useMemo(() => {
    return Math.ceil(sortedItems.length / PAGE_SIZE)
  }, [sortedItems.length])

  // 获取页面标题
  const pageTitle = useMemo(() => {
    // 有分类筛选时显示分类名
    if (selectedGenre !== '全部') {
      return selectedGenre
    }
    // 根据 section 显示
    if (selectedSection === 'movies') return '电影库'
    if (selectedSection === 'series') return '连续剧'
    return '影片库'
  }, [selectedSection, selectedGenre])

  // 是否显示轮播区和最近播放（首页模式 + 全部分类 + 无搜索）
  const showHero = selectedSection === 'home' && selectedGenre === '全部' && !searchQuery

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <EmptyState title="加载失败" description={error} />
  }

  if (selectedSection === 'home' && !data) {
    return <EmptyState title="暂无数据" description="请先添加电影源" />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 轮播区和最近播放（仅首页+全部分类+无搜索时显示） */}
      {showHero && (
        <>
          {/* 视频轮播区 */}
          <VideoCarousel movies={latestMovies} />

          {/* 最近播放 */}
          {data && (
            <RecentlyWatched items={data.recentlyWatched} />
          )}
        </>
      )}

      {/* 影片网格 */}
      {displayItems.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display-sm text-ink font-medium">{pageTitle}</h2>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="flex flex-col items-center px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors group"
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

      {/* 无数据提示 */}
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
