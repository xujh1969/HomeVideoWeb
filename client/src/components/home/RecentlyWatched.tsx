import { useNavigate } from 'react-router-dom'
import { Clock, Play } from 'lucide-react'
import type { WatchHistoryItem } from '@shared/types'

interface RecentlyWatchedProps {
  items: WatchHistoryItem[]
}

export function RecentlyWatched({ items }: RecentlyWatchedProps) {
  const navigate = useNavigate()

  const handleItemClick = (item: WatchHistoryItem) => {
    if (item.media_type === 'movie') {
      navigate(`/player/movie/${item.media_id}`)
    } else {
      navigate(`/player/episode/${item.media_id}`)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-ink-muted" />
        <h2 className="text-heading-md text-ink font-semibold">最近播放</h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.slice(0, 7).map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="flex-shrink-0 group cursor-pointer"
          >
            <div className="relative w-40 aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-surface-elevated to-surface transition-all duration-300 group-hover:shadow-glow-card">
              {item.local_poster ? (
                <img
                  src={item.local_poster}
                  alt={item.title_cn || item.title_en || undefined}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
                  <span className="text-ink-dim text-body-sm">暂无海报</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-canvas-deep/80 via-transparent to-transparent" />
              
              {item.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-elevated">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-brand-cyan"
                    style={{ width: `${item.progress * 100}%` }}
                  />
                </div>
              )}
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-3 bg-primary/90 rounded-full">
                  <Play className="w-6 h-6 text-ink fill-ink" />
                </div>
              </div>
            </div>
            
            <div className="mt-2 max-w-40">
              <h3 className="text-card-title text-ink font-semibold truncate">
                {item.title_cn || item.title_en || '未知'}
              </h3>
              {item.episode_number !== undefined && (
                <p className="text-caption text-ink-muted">
                  S{item.season_number}E{item.episode_number}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}