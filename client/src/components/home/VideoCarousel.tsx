import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Movie } from '@shared/types'

interface VideoCarouselProps {
  movies: Movie[]
}

const CLIP_DURATION = 10 // 每个片段播放10秒
const TRANSITION_DURATION = 500 // 切换动画时长

export function VideoCarousel({ movies }: VideoCarouselProps) {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // 没有影片时显示欢迎信息
  if (movies.length === 0) {
    return (
      <div className="relative h-[400px] bg-gradient-to-br from-surface-elevated via-surface to-canvas-deep rounded-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-brand-magenta flex items-center justify-center mx-auto mb-4">
              <Play className="w-10 h-10 text-ink fill-ink" />
            </div>
            <h2 className="text-heading-lg text-ink mb-4">欢迎来到家庭影视平台</h2>
            <p className="text-body-md text-ink-muted">添加电影源以开始您的媒体库</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-canvas-deep/50 via-transparent to-transparent" />
      </div>
    )
  }

  const currentMovie = movies[currentIndex]

  // 随机生成开始时间（在电影开始15分钟后，结束15分钟前）
  const generateRandomStartTime = (duration: number) => {
    const minTime = 15 * 60 // 15分钟 = 900秒
    const maxTime = Math.max(minTime + 10, duration - 15 * 60) // 确保至少有10秒的播放范围
    return Math.floor(Math.random() * (maxTime - minTime)) + minTime
  }

  // 初始化当前视频
  useEffect(() => {
    if (currentMovie) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [currentIndex])

  // 视频加载后设置开始时间
  useEffect(() => {
    const video = videoRef.current
    if (!video || !currentMovie) return

    const handleLoadedMetadata = () => {
      const randomStart = generateRandomStartTime(video.duration)
      video.currentTime = randomStart
      video.play().catch(() => {
        // 自动播放可能被阻止，静默处理
      })
      setIsLoading(false)
    }

    const handleError = () => {
      setHasError(true)
      setIsLoading(false)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
    }
  }, [currentMovie])

  // 定时切换到下一个视频
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext()
    }, CLIP_DURATION * 1000)

    return () => clearInterval(timer)
  }, [currentIndex])

  const handleNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length)
      setIsTransitioning(false)
    }, TRANSITION_DURATION)
  }

  const handlePrev = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)
      setIsTransitioning(false)
    }, TRANSITION_DURATION)
  }

  const handleClick = () => {
    if (currentMovie) {
      navigate(`/movie/${currentMovie.id}`)
    }
  }

  return (
    <div className="relative h-[400px] rounded-2xl overflow-hidden mb-8 group">
      {/* 视频背景 */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        {hasError ? (
          // 视频加载失败时显示海报
          currentMovie.local_poster || currentMovie.poster_path ? (
            <img
              src={currentMovie.local_poster || currentMovie.poster_path || undefined}
              alt={currentMovie.title_cn || currentMovie.title_en || undefined}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-brand-magenta/20 to-brand-coral/10" />
          )
        ) : (
          <video
            ref={videoRef}
            src={`/api/stream/movie/${currentMovie.id}/direct`}
            className="w-full h-full object-cover"
            muted
            playsInline
            poster={currentMovie.local_poster || currentMovie.poster_path || undefined}
          />
        )}
      </div>

      {/* 点击蒙版层 */}
      <div 
        className="absolute inset-0 bg-black/25 cursor-pointer z-10"
        onClick={handleClick}
      />

      {/* 加载指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas-deep/50">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-canvas-deep via-canvas-deep/30 to-transparent" />

      {/* 左下角影片信息 */}
      <div className="absolute bottom-6 left-6 right-24 z-10">
        <div className="flex items-center gap-4 mb-2">
          {currentMovie.filename_genre && (
            <span className="text-ink text-caption font-medium">
              {currentMovie.filename_genre}
            </span>
          )}
          {currentMovie.douban_rating && (
            <span className="text-brand-coral text-caption font-bold">
              {currentMovie.douban_rating.toFixed(1)}
            </span>
          )}
        </div>
        <h2 
          className="text-4xl font-bold text-ink cursor-pointer hover:text-primary transition-colors"
          onClick={handleClick}
        >
          {currentMovie.title_cn || currentMovie.title_en}
        </h2>
        {currentMovie.title_en && currentMovie.title_cn && currentMovie.title_en !== currentMovie.title_cn && (
          <p className="text-body-sm text-ink-muted mb-2">{currentMovie.title_en}</p>
        )}
        {currentMovie.overview && (
          <p className="text-body-sm text-ink-muted line-clamp-2">{currentMovie.overview}</p>
        )}
      </div>

      {/* 轮播指示器 */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true)
                setTimeout(() => {
                  setCurrentIndex(index)
                  setIsTransitioning(false)
                }, TRANSITION_DURATION)
              }
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-primary w-6' 
                : 'bg-ink-muted/50 hover:bg-ink-muted'
            }`}
          />
        ))}
      </div>

      {/* 左右切换按钮 */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-elevated/80 text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-elevated z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-elevated/80 text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-elevated z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* 点击提示 */}
      <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="px-3 py-1 rounded-full bg-surface-elevated/80 text-ink-muted text-caption">
          点击查看详情
        </span>
      </div>
    </div>
  )
}