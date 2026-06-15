import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Volume2, VolumeX, Maximize, Minimize, Pause, Play } from 'lucide-react'
import { getMovieById, getSeriesById, addWatchHistory } from '@/utils/api'
import type { Movie, Series, Episode } from '@shared/types'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function PlayerPage() {
  const { type, id, episodeId } = useParams<{ type: string; id: string; episodeId?: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [media, setMedia] = useState<Movie | Episode | null>(null)
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true)
      setError(null)
      try {
        if (type === 'movie') {
          const movie = await getMovieById(parseInt(id!))
          setMedia(movie)
        } else if (type === 'episode' && episodeId) {
          // episodeId = episode ID, id = series ID
          const seriesId = parseInt(id!)
          const epId = parseInt(episodeId)
          const seriesData = await getSeriesById(seriesId)
          const episode = seriesData.seasons.flatMap(s => s.episodes).find(e => e.id === epId)
          if (episode) {
            setMedia(episode)
            setSeries(seriesData)
          } else {
            setError('未找到该剧集')
          }
        } else {
          setError('无效的播放地址')
        }
      } catch (err) {
        setError('加载失败，请稍后重试')
      }
      setLoading(false)
    }
    fetchMedia()
  }, [type, id, episodeId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleVideoError)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && media) {
        addWatchHistory(type === 'movie' ? 'movie' : 'episode', media.id, series?.id || undefined, progress / 100)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isPlaying, progress, type, media, series])

  const togglePlay = () => {
    const video = videoRef.current
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (video) {
      video.muted = !video.muted
      setIsMuted(video.muted)
    }
  }

  const toggleFullscreen = async () => {
    const container = document.getElementById('player-container')
    if (!container) return

    if (!document.fullscreenElement) {
      await container.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleProgressClick = (e: React.MouseEvent) => {
    const video = videoRef.current
    const rect = progressRef.current?.getBoundingClientRect()
    if (video && rect) {
      const percent = (e.clientX - rect.left) / rect.width
      video.currentTime = percent * video.duration
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!media) {
    return (
      <div className="fixed inset-0 bg-canvas-deep z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-body text-ink-dim mb-2">{error || '影片不存在'}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:text-primary-hover underline"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  const title = type === 'movie' 
    ? (media as Movie).title_cn || (media as Movie).title_en
    : series?.title_cn || series?.title_en || '未知'

  const episodeInfo = type === 'episode' 
    ? `S${(media as Episode).season_number}E${(media as Episode).episode_number}`
    : ''

  return (
    <div className="fixed inset-0 bg-canvas-deep z-50">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-body-strong/80 hover:text-body-strong transition-colors h-9"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-button font-medium">返回</span>
        </button>
        
        <div className="text-center">
          <h1 className="text-ink font-medium text-title-md">{title}</h1>
          {episodeInfo && (
            <p className="text-muted text-caption">{episodeInfo}</p>
          )}
        </div>
        
        <div className="w-24" />
      </div>

      <div id="player-container" className="h-[calc(100vh-80px)] relative">
        {videoError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas-deep">
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
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            poster={(type === 'movie' ? (media as Movie).local_poster || (media as Movie).poster_path : series?.local_poster || series?.poster_path) || undefined}
          >
          {/* MP4/WebM/OGG 浏览器原生支持 */}
          {['.mp4', '.webm', '.ogg'].includes((media as any).ext) && (
            <source
              src={type === 'episode' && episodeId ? `/api/stream/episode/${episodeId}/direct` : `/api/stream/${type}/${id}/direct`}
              type={`video/${(media as any).ext.replace('.', '')}`}
            />
          )}
          {/* MKV等其他格式，不指定type让浏览器尝试 */}
          <source
            src={type === 'episode' && episodeId ? `/api/stream/episode/${episodeId}/direct` : `/api/stream/${type}/${id}/direct`}
          />
          您的浏览器不支持视频播放
        </video>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-canvas-deep/90 via-canvas-deep/50 to-transparent p-6">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="h-1 bg-surface-card rounded-md cursor-pointer mb-4 relative group"
          >
            <div
              className="h-full bg-primary rounded-md"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-glow"
              style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-body-strong/80 text-caption">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMute}
                className="text-body-strong/80 hover:text-body-strong transition-colors h-9 flex items-center justify-center"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              
              <button
                onClick={togglePlay}
                className="p-2 bg-primary rounded-full hover:bg-primary-hover transition-colors h-10 flex items-center justify-center shadow-glow"
              >
                {isPlaying ? <Pause className="w-6 h-6 text-ink" /> : <Play className="w-6 h-6 text-ink fill-ink" />}
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="text-body-strong/80 hover:text-body-strong transition-colors h-9 flex items-center justify-center"
              >
                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}