import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Check, AlertCircle, Trash, RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react'
import { getSources, addSource, updateSource, deleteSource, testSource, testSourceConfig, clearLibrary } from '@/utils/api'
import type { MovieSource, SourceInput } from '@shared/types'

interface SettingsDialogProps {
  onClose: () => void
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [sources, setSources] = useState<MovieSource[]>([])
  const [editingSource, setEditingSource] = useState<MovieSource | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [testResult, setTestResult] = useState<{ [key: number]: { status: string; message: string } | undefined }>({})
  const [testConfigResult, setTestConfigResult] = useState<{ status: string; message: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  
  const [formData, setFormData] = useState<SourceInput>({
    name: '',
    source_type: 'local',
    address: '',
    port: 445,
    username: '',
    password: '',
    directory: '',
    mount_point: '',
    enabled: true,
    scan_interval: 3600,
  })

  useEffect(() => {
    const fetchSources = async () => {
      const result = await getSources()
      setSources(result.sources)
    }
    fetchSources()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSource) {
      await updateSource(editingSource.id, formData)
    } else {
      await addSource(formData)
    }
    setShowForm(false)
    setEditingSource(null)
    setFormData({
      name: '',
      source_type: 'local',
      address: '',
      port: 445,
      username: '',
      password: '',
      directory: '',
      mount_point: '',
      enabled: true,
      scan_interval: 3600,
    })
    const result = await getSources()
    setSources(result.sources)
  }

  const handleEdit = (source: MovieSource) => {
    setEditingSource(source)
    setFormData({
      name: source.name,
      source_type: source.source_type,
      address: source.address,
      port: source.port || 445,
      username: source.username || '',
      password: source.password || '',
      directory: source.directory,
      mount_point: source.mount_point || '',
      enabled: source.enabled === 1,
      scan_interval: source.scan_interval,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    await deleteSource(id)
    const result = await getSources()
    setSources(result.sources)
  }

  const handleTest = async (id: number) => {
    const result = await testSource(id)
    setTestResult(prev => ({ ...prev, [id]: result }))
    setTimeout(() => {
      setTestResult(prev => ({ ...prev, [id]: undefined }))
    }, 3000)
  }

  const handleTestConfig = async () => {
    if (!formData.address) {
      setTestConfigResult({ status: 'error', message: '请填写地址' })
      return
    }
    setIsTesting(true)
    try {
      const result = await testSourceConfig(formData)
      setTestConfigResult(result)
      setTimeout(() => {
        setTestConfigResult(null)
      }, 5000)
    } catch (err) {
      setTestConfigResult({ status: 'error', message: '测试失败，请检查配置' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleClearLibrary = async () => {
    setIsClearing(true)
    try {
      await clearLibrary()
      setShowClearConfirm(false)
      alert('媒体库已清空！')
      window.location.reload()
    } catch (err) {
      console.error('Failed to clear library:', err)
      alert('清空失败，请重试')
    } finally {
      setIsClearing(false)
    }
  }

  const statusColors: Record<string, string> = {
    online: 'bg-success-text',
    offline: 'bg-ink-dim',
    error: 'bg-error-text',
    unknown: 'bg-ink-dim',
  }

  return (
    <div className="fixed inset-0 bg-canvas-deep/80 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="bg-gradient-to-br from-surface-elevated to-surface rounded-xl w-[600px] max-h-[80vh] overflow-hidden shadow-glow-card">
        <div className="flex items-center justify-between px-6 py-4 bg-surface/50">
          <h2 className="text-heading-md text-ink font-semibold">电影源管理</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-elevated rounded-full transition-all text-ink-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {showClearConfirm ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-error-text/10 rounded-xl">
                <AlertCircle className="w-6 h-6 text-error-text" />
                <div>
                  <h3 className="text-body-md font-semibold text-ink">确认清空媒体库？</h3>
                  <p className="text-caption text-ink-muted mt-1">此操作将删除所有电影、剧集和观看历史，且无法恢复。</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleClearLibrary}
                  disabled={isClearing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-error-text text-ink rounded-full font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isClearing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      清空中...
                    </>
                  ) : (
                    <>
                      <Trash className="w-4 h-4" />
                      确认清空
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="px-4 py-2.5 bg-surface text-ink rounded-full font-semibold hover:bg-surface-elevated transition-all disabled:opacity-50 h-10"
                >
                  取消
                </button>
              </div>
            </div>
          ) : showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink-muted mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 h-10"
                  required
                />
              </div>
              
              <div>
                <label className="block text-body-sm font-medium text-ink-muted mb-1">类型</label>
                <select
                  value={formData.source_type}
                  onChange={(e) => setFormData({ ...formData, source_type: e.target.value as SourceInput['source_type'] })}
                  className="w-full px-4 py-2.5 bg-surface rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 h-10"
                >
                  <option value="local">本地路径</option>
                  <option value="smb">SMB 共享</option>
                  <option value="nfs">NFS 共享</option>
                </select>
              </div>
              
              <div>
                <label className="block text-body-sm font-medium text-ink-muted mb-1">地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 h-10"
                  placeholder="如 D:\Movies 或 \\192.168.1.100\video"
                  required
                />
              </div>
              
              {(formData.source_type === 'smb' || formData.source_type === 'nfs') && (
                <>
                  <div>
                    <label className="block text-body-sm font-medium text-ink-muted mb-1">端口</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-surface rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-ink-muted mb-1">用户名</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-ink-muted mb-1">密码</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 h-10"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-body-sm font-medium text-ink-muted mb-1">扫描目录</label>
                <input
                  type="text"
                  value={formData.directory}
                  onChange={(e) => setFormData({ ...formData, directory: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 h-10"
                  placeholder="留空则扫描根目录"
                />
              </div>

              {/* 测试结果 */}
              {testConfigResult && (
                <div className={`p-3 rounded-lg ${testConfigResult.status === 'online' ? 'bg-success-text/10 text-success-text' : 'bg-error-text/10 text-error-text'}`}>
                  <div className="flex items-center gap-2">
                    {testConfigResult.status === 'online' ? (
                      <Wifi className="w-4 h-4" />
                    ) : (
                      <WifiOff className="w-4 h-4" />
                    )}
                    <span className="text-body-sm">{testConfigResult.message}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleTestConfig}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface text-ink rounded-full font-semibold hover:bg-surface-elevated transition-all disabled:opacity-50 h-10"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      测试连接
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-ink rounded-full font-semibold hover:shadow-glow-primary hover:-translate-y-0.5 transition-all h-10"
                >
                  {editingSource ? '保存修改' : '添加源'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingSource(null)
                  }}
                  className="px-4 py-2.5 bg-surface text-ink rounded-full font-semibold hover:bg-surface-elevated transition-all h-10"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-body-md text-ink-muted">已配置 {sources.length} 个电影源</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-ink rounded-full font-semibold hover:shadow-glow-primary hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  添加源
                </button>
              </div>
              
              <div className="space-y-3">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink text-card-title">{source.name}</h3>
                        <span className={`w-2 h-2 rounded-full ${statusColors[source.status]}`} />
                      </div>
                      <p className="text-caption text-ink-muted mt-1">{source.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {testResult[source.id] && (
                        <span className={`text-caption ${testResult[source.id]?.status === 'online' ? 'text-success-text' : 'text-error-text'}`}>
                          {testResult[source.id]?.message}
                        </span>
                      )}
                      <button
                        onClick={() => handleTest(source.id)}
                        className="p-2 hover:bg-surface-elevated rounded-full text-ink-muted hover:text-ink transition-all"
                        title="测试连接"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(source)}
                        className="p-2 hover:bg-surface-elevated rounded-full text-ink-muted hover:text-ink transition-all"
                        title="编辑"
                      >
                        <span className="text-caption font-medium">编辑</span>
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="p-2 hover:bg-surface-elevated rounded-full text-ink-muted hover:text-error-text transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {sources.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 mb-4 text-ink-dim" />
                    <p className="text-body-md text-ink-muted">暂无电影源配置</p>
                    <p className="text-caption text-ink-dim">点击上方按钮添加电影源</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-surface">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-error-text/10 text-error-text rounded-full font-semibold hover:bg-error-text/20 transition-all"
                >
                  <Trash className="w-4 h-4" />
                  清空媒体库
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}