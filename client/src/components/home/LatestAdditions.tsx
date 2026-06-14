import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { MediaCardData } from '@shared/types'

interface LatestAdditionsProps {
  items: MediaCardData[]
}

export function LatestAdditions({ items }: LatestAdditionsProps) {
  const navigate = useNavigate()
  const limitedItems = items.slice(0, 5)

  const handleItemClick = (item: MediaCardData) => {
    if (item.type === 'movie') {
      navigate(`/movie/${item.id}`)
    } else {
      navigate(`/series/${item.id}`)
    }
  }

  if (limitedItems.length === 0) {
    return null
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-ink-muted" />
        <h2 className="text-heading-md text-ink font-semibold">最新添加</h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2">
        {limitedItems.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            onClick={() => handleItemClick(item)}
            className="flex-shrink-0 group cursor-pointer"
          >
            <div className="relative w-36 aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-surface-elevated to-surface transition-all duration-300 group-hover:shadow-glow-card">
              {item.local_poster ? (
                <img
                  src={item.local_poster}
                  alt={item.title_cn || item.title_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
                  <span className="text-ink-dim text-body-sm">暂无海报</span>
                </div>
              )}
              
              {item.type === 'series' && item.season_label && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-caption font-semibold bg-gradient-to-r from-brand-magenta to-brand-coral text-ink">
                  {item.season_label}
                </div>
              )}
            </div>
            
            <div className="mt-2 max-w-36">
              <h3 className="text-body-sm font-semibold text-ink truncate">
                {item.title_cn || item.title_en || '未知'}
              </h3>
              {item.filename_genre && (
                <p className="text-caption text-ink-muted">{item.filename_genre}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}