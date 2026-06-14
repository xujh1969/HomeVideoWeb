import type { MediaCardData } from '@shared/types'
import { MediaCard } from './MediaCard'
import { EmptyState } from '../common/EmptyState'

interface MediaGridProps {
  items: MediaCardData[]
  title: string
}

export function MediaGrid({ items, title }: MediaGridProps) {
  if (items.length === 0) {
    return <EmptyState title="暂无内容" description="还没有添加任何影片" />
  }

  return (
    <section className="mb-8">
      <h2 className="text-display-sm text-ink font-medium mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <MediaCard key={`${item.type}-${item.id}`} media={item} />
        ))}
      </div>
    </section>
  )
}