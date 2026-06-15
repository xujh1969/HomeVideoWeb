import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Clock, Calendar, ArrowLeft, RefreshCw } from 'lucide-react'
import { getMovieById, fetchMovieMetadata, addWatchHistory } from '@/utils/api'
import type { Movie } from '@shared/types'
import { formatDate, formatRuntime, formatFileSize } from '@/utils/formatters'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

function getRatingColor(rating: number | undefined): string {
  if (!rating) return 'text-muted'
  if (rating >= 8) return 'text-primary'
  if (rating >= 6) return 'text-accent-cyan'
  return 'text-muted'
}

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true)
      const result = await getMovieById(parseInt(id!))
      setMovie(result)
      // 添加到观看历史
      addWatchHistory('movie', result.id)
      setLoading(false)
    }
    fetchMovie()
  }, [id])

  // 自动播放
  useEffect(() => {
    if (movie && videoRef.current) {
      videoRef.current.play().catch(() => {
        // 自动播放被阻止，静默处理
      })
    }
  }, [movie])

  // 监听视频的全屏请求和错误
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // 监听视频的全屏按钮点击
    video.addEventListener('webkitfullscreenchange', handleFullscreen)
    video.addEventListener('mozfullscreenchange', handleFullscreen)
    video.addEventListener('fullscreenchange', handleFullscreen)
    video.addEventListener('error', handleVideoError)

    return () => {
      video.removeEventListener('webkitfullscreenchange', handleFullscreen)
      video.removeEventListener('mozfullscreenchange', handleFullscreen)
      video.removeEventListener('fullscreenchange', handleFullscreen)
      video.removeEventListener('error', handleVideoError)
    }
  }, [])

  const handleVideoError = (e: Event) => {
    const video = e.target as HTMLVideoElement
    console.error('Video error:', video.error)
    if (video.error?.code === 4 || video.error?.code === 3) {
      setVideoError('视频文件不存在或无法播放')
    } else {
      setVideoError('视频加载失败，请稍后重试')
    }
  }

  const handleFullscreen = async () => {
    const container = document.getElementById('player-container')
    const video = videoRef.current
    if (!container || !video) return

    if (document.fullscreenElement === video) {
      await document.exitFullscreen()
      await container.requestFullscreen()
    } else if (!document.fullscreenElement) {
      await container.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const handleDoubleClick = () => {
    handleFullscreen()
  }

  // ESC 键返回
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(-1)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const handleFetchMetadata = async () => {
    setFetchingMetadata(true)
    await fetchMovieMetadata(movie!.id)
    const result = await getMovieById(movie!.id)
    setMovie(result)
    setFetchingMetadata(false)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!movie) {
    return (
      <div className="p-6">
        <p className="text-body">影片不存在</p>
      </div>
    )
  }

  const cast = movie.cast ? movie.cast.split(',').filter(Boolean) : []
  const genres = movie.genres ? movie.genres.split(',').filter(Boolean) : []

  return (
    <div className="fixed top-16 left-56 right-0 bottom-0 z-30 flex bg-surface overflow-hidden">
      {/* 左侧：视频播放区 */}
      <div 
        id="player-container"
        className="flex-1 flex items-center justify-center relative bg-surface"
        onDoubleClick={handleDoubleClick}
      >
        <div className="w-full h-full flex items-center justify-center p-4">
          {videoError ? (
            <div className="flex flex-col items-center justify-center bg-black rounded-lg p-8">
              <p className="text-body text-ink-dim mb-4">{videoError}</p>
              <button
                onClick={() => {
                  setVideoError(null)
                  videoRef.current?.load()
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-ink font-medium rounded-lg transition-colors"
              >
                重试播放
              </button>
            </div>
          ) : (
            <div className="bg-black rounded-lg overflow-hidden shadow-lg max-w-full max-h-full">
              <video
                ref={videoRef}
                src={`/api/stream/movie/${movie.id}/direct`}
                className="w-auto h-auto max-w-full max-h-full object-contain"
                controls
                autoPlay
                playsInline
                poster={movie.local_poster || movie.poster_path || undefined}
              />
            </div>
          )}
        </div>

        {/* 非全屏时的全屏按钮 */}
        
      </div>

      {/* 右侧：简介区 */}
      <div className="w-80 bg-surface-elevated overflow-y-auto border-l border-surface-strong">
        <div className="px-4 py-4">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-body hover:text-body-strong mb-4 transition-colors h-9 px-3 rounded-lg hover:bg-surface-strong cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-button font-medium">返回</span>
          </button>

          {/* 标题和评分 */}
          <div className="mb-4">
            {movie.filename_genre && (
              <span className="text-caption text-ink-dim mb-1 block">
                {movie.filename_genre}
              </span>
            )}
            <h1 className="text-xl font-bold text-ink mb-1">
              {movie.title_cn || movie.title_en}
            </h1>
            {movie.title_en && movie.title_cn && movie.title_en !== movie.title_cn && (
              <p className="text-body text-ink-dim">{movie.title_en}</p>
            )}
          </div>

          {/* 评分显示 */}
          <div className="flex items-center gap-4 mb-4">
            {movie.douban_rating && (
              <div>
                <span className={`text-lg font-bold ${getRatingColor(movie.douban_rating)}`}>
                  {movie.douban_rating.toFixed(1)}
                </span>
                <span className="text-caption text-ink-dim ml-1">豆瓣</span>
              </div>
            )}
            {movie.imdb_rating && (
              <div>
                <span className={`text-lg font-bold ${getRatingColor(movie.imdb_rating)}`}>
                  {movie.imdb_rating.toFixed(1)}
                </span>
                <span className="text-caption text-ink-dim ml-1">IMDb</span>
              </div>
            )}
            {movie.filename_rating && (
              <div>
                <span className={`text-lg font-bold ${getRatingColor(movie.filename_rating)}`}>
                  {movie.filename_rating.toFixed(1)}
                </span>
                <span className="text-caption text-ink-dim ml-1">评分</span>
              </div>
            )}
          </div>

          {/* 基本信息 */}
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-body-sm text-ink-dim mb-4">
            {movie.release_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(movie.release_date)}
              </span>
            )}
            {movie.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRuntime(movie.runtime)}
              </span>
            )}
            {movie.file_size && (
              <span>{formatFileSize(movie.file_size)}</span>
            )}
          </div>

          {/* 简介 */}
          {movie.overview && (
            <div className="mb-4">
              <h3 className="text-caption text-ink-dim uppercase tracking-wider mb-2">剧情简介</h3>
              <p className="text-body-sm text-ink leading-relaxed">
                {movie.overview}
              </p>
            </div>
          )}

          {/* 导演 */}
          {movie.director && (
            <div className="mb-4">
              <h3 className="text-caption text-ink-dim uppercase tracking-wider mb-1">导演</h3>
              <p className="text-body text-ink">{movie.director}</p>
            </div>
          )}

          {/* 演员 */}
          {cast.length > 0 && (
            <div className="mb-4">
              <h3 className="text-caption text-ink-dim uppercase tracking-wider mb-1">演员</h3>
              <p className="text-body text-ink">{cast.join(' / ')}</p>
            </div>
          )}

          {/* 分类 */}
          {genres.length > 0 && (
            <div className="mb-4">
              <h3 className="text-caption text-ink-dim uppercase tracking-wider mb-2">分类</h3>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre: string) => (
                  <span
                    key={genre}
                    className="text-caption text-ink-dim"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/player/movie/${movie.id}`)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover text-ink font-medium rounded-lg transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>在新页面播放</span>
            </button>
            
            <button
              onClick={handleFetchMetadata}
              disabled={fetchingMetadata}
              className="p-3 bg-surface-elevated hover:bg-surface-strong rounded-lg text-body hover:text-body-strong transition-colors disabled:opacity-50"
              title="刷新元数据"
            >
              <RefreshCw className={`w-5 h-5 ${fetchingMetadata ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}