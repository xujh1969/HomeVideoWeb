export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

export function formatRuntime(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours}小时${mins}分钟`
  return `${mins}分钟`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function getRatingColor(rating: number | null): string {
  if (rating === null || rating === undefined) return 'text-text-tertiary'
  if (rating >= 8.0) return 'text-rating-high'
  if (rating >= 6.0) return 'text-rating-mid'
  return 'text-rating-low'
}

export function getRatingClass(rating: number | null): string {
  if (rating === null || rating === undefined) return 'bg-text-tertiary/30'
  if (rating >= 8.0) return 'bg-rating-high'
  if (rating >= 6.0) return 'bg-rating-mid'
  return 'bg-rating-low'
}
