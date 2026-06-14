import { useNavigate } from 'react-router-dom'
import type { MediaCardData } from '@shared/types'

interface MediaCardProps {
  media: MediaCardData
}

function getRatingColor(rating: number | undefined): string {
  if (!rating) return 'text-ink-dim'
  if (rating >= 8) return 'text-brand-green'
  if (rating >= 6) return 'text-primary'
  return 'text-ink-muted'
}

export function MediaCard({ media }: MediaCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (media.type === 'movie') {
      navigate(`/movie/${media.id}`)
    } else {
      navigate(`/series/${media.id}`)
    }
  }

  const rating = media.imdb_rating || media.filename_rating

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface transition-all duration-300 transform group-hover:scale-[1.02] group-hover:shadow-glow-card">
        {media.local_poster ? (
          <img
            src={media.local_poster}
            alt={media.title_cn || media.title_en}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
            <span className="text-ink-dim text-body-sm">暂无海报</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-canvas-deep via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-wrap gap-1">
            {rating && (
              <span className="px-2 py-0.5 rounded-full text-caption font-semibold bg-primary/90 text-ink">
                {rating.toFixed(1)}
              </span>
            )}
            {media.filename_genre && (
              <span className="px-2 py-0.5 rounded-full text-caption bg-surface-elevated/90 text-ink">
                {media.filename_genre}
              </span>
            )}
          </div>
        </div>
        
        {media.type === 'series' && media.season_label && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-caption font-semibold bg-gradient-to-r from-brand-magenta to-brand-coral text-ink">
            {media.season_label}
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <h3 className="text-card-title text-ink font-semibold truncate">
          {media.title_cn || media.title_en || '未知'}
        </h3>
        {media.title_en && media.title_cn && (
          <p className="text-caption text-ink-dim truncate mt-0.5">{media.title_en}</p>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          {rating && (
            <span className={`text-caption font-semibold ${getRatingColor(rating)}`}>
              {rating.toFixed(1)}
            </span>
          )}
          {media.filename_genre && (
            <span className="text-caption text-ink-muted">{media.filename_genre}</span>
          )}
          {media.episode_count && (
            <span className="text-caption text-ink-muted">{media.episode_count}集</span>
          )}
        </div>
      </div>
    </div>
  )
}