import { useState, useEffect } from 'react'
import { Settings, RefreshCw, Film, Search, X } from 'lucide-react'
import { SettingsDialog } from '../settings/SettingsDialog'
import { RefreshProgressDialog } from '../common/RefreshProgressDialog'
import { refreshLibrary } from '@/utils/api'

interface HeaderProps {
  onSearch?: (query: string) => void
}

export function Header({ onSearch }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showRefreshProgress, setShowRefreshProgress] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleRefresh = async () => {
    setShowRefreshProgress(true)
    await refreshLibrary()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    onSearch?.(value)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    onSearch?.('')
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6 transition-all duration-300 ${
          isScrolled ? 'bg-gradient-header backdrop-blur-md' : 'bg-canvas/80 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-brand-magenta">
            <Film className="w-6 h-6 text-ink" />
          </div>
          <h1 className="text-heading-md text-ink font-semibold">家庭影视平台</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="搜索影片..."
              className="w-64 h-9 pl-10 pr-10 bg-surface rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-surface-elevated rounded-full"
              >
                <X className="w-3.5 h-3.5 text-ink-dim" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={showRefreshProgress}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-ink rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-primary hover:-translate-y-0.5"
          >
            <RefreshCw className={`w-4 h-4 ${showRefreshProgress ? 'animate-spin' : ''}`} />
            同步媒体库
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-surface rounded-full text-ink-muted hover:text-ink hover:bg-surface-elevated transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showRefreshProgress && <RefreshProgressDialog onClose={() => setShowRefreshProgress(false)} />}
    </>
  )
}