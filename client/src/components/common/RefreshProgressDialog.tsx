import { useState, useEffect } from 'react'
import { X, FolderSearch, Film, Tv, Trash2, Database, CheckCircle2, AlertCircle, Loader2, Key } from 'lucide-react'
import { getRefreshStatus } from '@/utils/api'

interface RefreshProgressDialogProps {
  onClose: () => void
}

interface ProgressData {
  status: 'idle' | 'scanning' | 'cleaning' | 'metadata' | 'done' | 'error'
  progress: {
    current_source: string
    found_movies: number
    found_series: number
    found_episodes: number
    removed_movies: number
    removed_episodes: number
    errors: string[]
    metadata_current_title: string
    metadata_current_type: 'movie' | 'series'
    metadata_completed: number
    metadata_total: number
    metadata_success: number
    metadata_failed: number
  }
}

const STATUS_CONFIG = {
  scanning: {
    label: '扫描文件',
    description: '正在扫描媒体源中的视频文件...',
    icon: FolderSearch,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  cleaning: {
    label: '清理数据',
    description: '正在移除已删除的文件记录...',
    icon: Trash2,
    color: 'text-ink-muted',
    bgColor: 'bg-surface',
  },
  metadata: {
    label: '获取元数据',
    description: '正在从 OMDb/豆瓣 获取影片信息...',
    icon: Database,
    color: 'text-brand-magenta',
    bgColor: 'bg-brand-magenta/10',
  },
  done: {
    label: '完成',
    description: '同步媒体库已完成',
    icon: CheckCircle2,
    color: 'text-success-text',
    bgColor: 'bg-success-text/10',
  },
  error: {
    label: '出错',
    description: '刷新过程中遇到错误',
    icon: AlertCircle,
    color: 'text-error-text',
    bgColor: 'bg-error-text/10',
  },
  idle: {
    label: '等待中',
    description: '准备开始刷新...',
    icon: Loader2,
    color: 'text-ink-muted',
    bgColor: 'bg-surface',
  },
}

export function RefreshProgressDialog({ onClose }: RefreshProgressDialogProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null)

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const status = await getRefreshStatus()
        setProgress(status as ProgressData)
        
        if (status.status === 'done' || status.status === 'error') {
          setTimeout(() => {
            if (status.status === 'done') {
              onClose()
            }
          }, 3000)
        }
      } catch (err) {
        console.error('Failed to get refresh status:', err)
      }
    }

    pollStatus()
    const interval = setInterval(pollStatus, 1000)

    return () => clearInterval(interval)
  }, [onClose])

  const currentStatus = progress?.status || 'idle'
  const config = STATUS_CONFIG[currentStatus]
  const StatusIcon = config.icon
  const totalFound = (progress?.progress?.found_movies || 0) + (progress?.progress?.found_series || 0)

  const needsApiKey = progress?.status === 'metadata' && 
    progress?.progress?.metadata_total > 0 && 
    progress?.progress?.metadata_failed > 0 &&
    progress?.progress?.metadata_success === 0

  return (
    <div className="fixed inset-0 bg-canvas-deep/80 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="bg-gradient-to-br from-surface-elevated to-surface rounded-xl w-[520px] max-h-[90vh] overflow-hidden shadow-glow-card">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <StatusIcon className={`w-5 h-5 ${config.color} ${currentStatus === 'scanning' || currentStatus === 'metadata' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-heading-md text-ink font-semibold">同步媒体库</h2>
              <p className="text-caption text-ink-muted">{config.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-elevated rounded-full transition-all text-ink-muted hover:text-ink"
            disabled={currentStatus === 'scanning'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Steps */}
          <div className="space-y-3">
            <StepItem
              label="扫描媒体源"
              status={getStepStatus(currentStatus, 'scanning')}
              isActive={currentStatus === 'scanning'}
              subLabel={progress?.progress?.current_source}
            />
            <StepItem
              label="清理无效记录"
              status={getStepStatus(currentStatus, 'cleaning')}
              isActive={currentStatus === 'cleaning'}
            />
            <StepItem
              label="获取元数据"
              status={getStepStatus(currentStatus, 'metadata')}
              isActive={currentStatus === 'metadata'}
              subLabel={progress?.progress?.metadata_current_title}
              subType={progress?.progress?.metadata_current_type}
              completed={progress?.progress?.metadata_completed}
              total={progress?.progress?.metadata_total}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Film}
              label="电影"
              value={progress?.progress?.found_movies || 0}
              color="text-brand-magenta"
              bgColor="bg-brand-magenta/10"
            />
            <StatCard
              icon={Tv}
              label="剧集"
              value={progress?.progress?.found_series || 0}
              subValue={`${progress?.progress?.found_episodes || 0} 集`}
              color="text-primary"
              bgColor="bg-primary/10"
            />
          </div>

          {/* Metadata Stats */}
          {currentStatus === 'metadata' && progress?.progress && progress.progress.metadata_total && progress.progress.metadata_total > 0 && (
            <div className="flex items-center gap-4 text-caption">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-text" />
                <span className="text-success-text">成功 {progress?.progress?.metadata_success}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-error-text" />
                <span className="text-error-text">失败 {progress?.progress?.metadata_failed}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">
                  {progress?.progress?.metadata_completed} / {progress?.progress?.metadata_total}
                </span>
              </div>
            </div>
          )}

          {/* API Key Warning */}
          {needsApiKey && (
            <div className="bg-error-text/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-error-text text-body-sm font-medium mb-2">
                <Key className="w-4 h-4" />
                <span>OMDb API Key 配置问题</span>
              </div>
              <p className="text-caption text-ink-muted mb-2">
                元数据获取失败，请检查 OMDb API Key 是否正确配置。
              </p>
              <p className="text-caption text-ink-dim">
                请复制 <code className="bg-surface px-1 rounded">.env.sample</code> 为 <code className="bg-surface px-1 rounded">.env</code>，并填入正确的 API Key
              </p>
              <p className="text-caption text-ink-dim mt-1">
                需要配置的 Key: <code className="bg-surface px-1 rounded">OMDB_API_KEY</code>、<code className="bg-surface px-1 rounded">DOUBAN_API_KEY</code>
              </p>
            </div>
          )}

          {/* Cleanup Stats */}
          {(progress?.progress?.removed_movies || 0) > 0 || (progress?.progress?.removed_episodes || 0) > 0 ? (
            <div className="flex items-center gap-2 text-caption text-ink-muted">
              <Trash2 className="w-4 h-4" />
              <span>已清理 {progress?.progress?.removed_movies} 个电影、{progress?.progress?.removed_episodes} 个剧集</span>
            </div>
          ) : null}

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-caption text-ink-muted mb-2">
              <span>总进度</span>
              <span>{getProgressPercent(currentStatus, progress)}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentStatus === 'error' ? 'bg-error-text' : 'bg-gradient-to-r from-primary to-primary-light'
                }`}
                style={{ width: `${parseFloat(getProgressPercent(currentStatus, progress))}%` }}
              />
            </div>
          </div>

          {/* Errors */}
          {progress?.progress?.errors && progress.progress.errors.length > 0 && (
            <div className="bg-error-text/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-error-text text-body-sm font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>发生 {progress.progress.errors.length} 个错误</span>
              </div>
              <ul className="space-y-1">
                {progress.progress.errors.slice(0, 3).map((err, i) => (
                  <li key={i} className="text-caption text-ink-muted truncate">{err}</li>
                ))}
                {progress.progress.errors.length > 3 && (
                  <li className="text-caption text-ink-dim">...还有 {progress.progress.errors.length - 3} 个错误</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface/50">
          {currentStatus === 'done' && (
            <div className="flex items-center justify-center gap-2 text-success-text">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-body-md font-semibold">刷新完成！共发现 {totalFound} 个媒体</span>
            </div>
          )}
          {currentStatus === 'error' && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-ink rounded-full font-semibold hover:shadow-glow-primary transition-all"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type StepStatus = 'pending' | 'active' | 'done' | 'error'

function getStepStatus(currentStatus: string, step: string): StepStatus {
  const order = ['scanning', 'cleaning', 'metadata']
  const currentIndex = order.indexOf(currentStatus)
  const stepIndex = order.indexOf(step)

  if (currentStatus === 'error' && stepIndex <= currentIndex) return 'error'
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

function getProgressPercent(status: string, progress: ProgressData | null): string {
  let percent: number
  
  if (status === 'metadata' && progress && progress.progress && progress.progress.metadata_total && progress.progress.metadata_total > 0) {
    const metadataPercent = ((progress.progress.metadata_completed || 0) / progress.progress.metadata_total) * 95
    percent = 5 + metadataPercent
  } else {
    const map: Record<string, number> = {
      idle: 0,
      scanning: 2.5,
      cleaning: 5,
      metadata: 5,
      done: 100,
      error: 100,
    }
    percent = map[status] || 0
  }
  
  return percent.toFixed(2)
}

function StepItem({
  label,
  status,
  isActive,
  subLabel,
  subType,
  completed,
  total
}: {
  label: string
  status: StepStatus
  isActive: boolean
  subLabel?: string
  subType?: 'movie' | 'series'
  completed?: number
  total?: number
}) {
  const statusConfig = {
    pending: { icon: Circle, color: 'text-ink-dim', bgColor: 'bg-surface' },
    active: { icon: Loader2, color: 'text-primary', bgColor: 'bg-primary/10' },
    done: { icon: CheckCircle2, color: 'text-success-text', bgColor: 'bg-success-text/10' },
    error: { icon: AlertCircle, color: 'text-error-text', bgColor: 'bg-error-text/10' },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-full ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.color} ${status === 'active' ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex-1">
        <span className={`text-body-sm font-medium ${status === 'pending' ? 'text-ink-dim' : 'text-ink'}`}>
          {label}
        </span>
        {subLabel && isActive && (
          <div className="flex items-center gap-2 mt-1">
            {subType && (
              <span className="text-caption text-ink-muted uppercase">
                {subType === 'movie' ? '电影' : '剧集'}
              </span>
            )}
            <span className="text-caption text-ink font-medium truncate max-w-[200px]">
              {subLabel}
            </span>
            {completed !== undefined && total !== undefined && (
              <span className="text-caption text-ink-muted">
                ({completed}/{total})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Circle({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  bgColor,
}: {
  icon: any
  label: string
  value: number
  subValue?: string
  color: string
  bgColor: string
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${bgColor}`}>
      <Icon className={`w-6 h-6 ${color}`} />
      <div>
        <div className={`text-heading-sm font-semibold ${color}`}>{value}</div>
        <div className="flex items-center gap-2">
          <span className="text-caption text-ink-muted">{label}</span>
          {subValue && <span className="text-caption text-ink-muted">{subValue}</span>}
        </div>
      </div>
    </div>
  )
}