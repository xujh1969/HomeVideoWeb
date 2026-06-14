import { Film } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Film className="w-16 h-16 text-muted mb-4" />
      <h3 className="text-display-sm text-ink font-medium mb-2">{title}</h3>
      <p className="text-body text-muted">{description}</p>
    </div>
  )
}