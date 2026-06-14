import { Play, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Movie } from '@shared/types'

interface HeroBannerProps {
  featuredMovie?: Movie
}

export function HeroBanner({ featuredMovie }: HeroBannerProps) {
  const navigate = useNavigate()

  if (!featuredMovie) {
    return (
      <div className="relative h-[400px] bg-gradient-to-br from-surface-elevated via-surface to-canvas-deep rounded-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-brand-magenta flex items-center justify-center mx-auto mb-4">
              <Play className="w-10 h-10 text-ink fill-ink" />
            </div>
            <h2 className="text-heading-lg text-ink mb-4">欢迎来到家庭影视平台</h2>
            <p className="text-body-md text-ink-muted">添加电影源以开始浏览您的媒体库</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-canvas-deep/50 via-transparent to-transparent" />
      </div>
    )
  }

  return (
    <div className="relative h-[400px] rounded-2xl overflow-hidden mb-8">
      {featuredMovie.local_poster ? (
        <img
          src={featuredMovie.local_poster}
          alt={featuredMovie.title_cn || featuredMovie.title_en}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/30 via-brand-magenta/20 to-brand-coral/10" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-canvas-deep via-canvas-deep/50 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="max-w-2xl">
          {featuredMovie.filename_genre && (
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/80 to-brand-magenta/80 text-ink text-caption font-semibold mb-4">
              {featuredMovie.filename_genre}
            </span>
          )}
          
          <h1 className="text-heading-lg text-ink font-semibold mb-2">
            {featuredMovie.title_cn || featuredMovie.title_en}
          </h1>
          
          {featuredMovie.title_en && featuredMovie.title_cn && (
            <p className="text-body-md text-ink-muted mb-4">{featuredMovie.title_en}</p>
          )}
          
          {featuredMovie.overview && (
            <p className="text-body-sm text-ink-muted mb-6 line-clamp-2">
              {featuredMovie.overview}
            </p>
          )}
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/movie/${featuredMovie.id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-ink rounded-full font-semibold hover:shadow-glow-primary hover:-translate-y-0.5 transition-all"
            >
              <Play className="w-4 h-4" />
              立即播放
            </button>
            
            <button
              onClick={() => navigate(`/movie/${featuredMovie.id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-surface-elevated/80 text-ink rounded-full font-semibold hover:bg-surface-elevated transition-all"
            >
              详情
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}