import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Clock, Calendar, Film, ArrowLeft } from 'lucide-react'
import { getSeriesById, addWatchHistory } from '@/utils/api'
import type { Series, Episode } from '@shared/types'
import { formatDate, formatFileSize, getRatingClass, getRatingColor } from '@/utils/formatters'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [series, setSeries] = useState<(Series & { seasons: { season_number: number; episodes: Episode[] }[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSeason, setActiveSeason] = useState(1)

  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true)
      const result = await getSeriesById(parseInt(id!))
      setSeries(result)
      if (result.seasons.length > 0) {
        setActiveSeason(result.seasons[0].season_number)
      }
      setLoading(false)
    }
    fetchSeries()
  }, [id])

  const handlePlayEpisode = (episode: Episode) => {
    addWatchHistory('episode', episode.id, parseInt(id!))
    navigate(`/player/episode/${id}/${episode.id}`)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!series) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">连续剧不存在</p>
      </div>
    )
  }

  const genres = series.genres ? series.genres.split(',').filter(Boolean) : []
  const currentSeason = series.seasons.find(s => s.season_number === activeSeason)

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回</span>
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-shrink-0">
          <div className="w-64 md:w-72 aspect-[2/3] rounded-xl overflow-hidden shadow-elevated">
            {series.local_poster ? (
              <img
                src={series.local_poster}
                alt={series.title_cn || undefined}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
                <Film className="w-16 h-16 text-text-tertiary" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {(series.imdb_rating || series.filename_rating) && (
              <span className={`px-3 py-1 rounded-lg text-lg font-bold text-white ${getRatingClass(series.imdb_rating || series.filename_rating)}`}>
                {(series.imdb_rating || series.filename_rating)?.toFixed(1)}
              </span>
            )}
            {series.filename_genre && (
              <span className="px-3 py-1 rounded-lg bg-bg-tertiary text-text-secondary">
                {series.filename_genre}
              </span>
            )}
            {series.season_label && (
              <span className="px-3 py-1 rounded-lg bg-brand/90 text-white">
                {series.season_label}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {series.title_cn || series.title_en}
          </h1>
          {series.title_en && series.title_cn && (
            <p className="text-lg text-text-secondary mb-4">{series.title_en}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-6">
            {series.first_air_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(series.first_air_date)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {series.season_count}季 / {series.episode_count}集
            </span>
          </div>

          {series.overview && (
            <p className="text-text-secondary leading-relaxed mb-6">
              {series.overview}
            </p>
          )}

          {genres.length > 0 && (
            <div className="bg-bg-secondary rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-text-tertiary mb-2">分类</h3>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre: string) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full bg-bg-tertiary text-text-secondary text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-6">
            {series.tmdb_rating && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${getRatingColor(series.tmdb_rating)}`}>
                  {series.tmdb_rating.toFixed(1)}
                </div>
                <div className="text-xs text-text-tertiary">TMDB</div>
              </div>
            )}
            {series.imdb_rating && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${getRatingColor(series.imdb_rating)}`}>
                  {series.imdb_rating.toFixed(1)}
                </div>
                <div className="text-xs text-text-tertiary">IMDb</div>
              </div>
            )}
            {series.douban_rating && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${getRatingColor(series.douban_rating)}`}>
                  {series.douban_rating.toFixed(1)}
                </div>
                <div className="text-xs text-text-tertiary">豆瓣</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {series.seasons.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
            {series.seasons.map((season) => (
              <button
                key={season.season_number}
                onClick={() => setActiveSeason(season.season_number)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSeason === season.season_number
                    ? 'bg-brand text-white'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                第{season.season_number}季
              </button>
            ))}
          </div>
        )}

        {currentSeason && (
          <div className="bg-bg-secondary rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary">
                第{activeSeason}季 · {currentSeason.episodes.length}集
              </h3>
            </div>
            <div className="divide-y divide-charcoal">
              {currentSeason.episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="flex items-center gap-4 p-4 hover:bg-bg-hover transition-colors"
                >
                  <button
                    onClick={() => handlePlayEpisode(episode)}
                    className="flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden relative"
                  >
                    <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
                      <span className="text-text-tertiary text-xs">EP{episode.episode_number}</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
                      <div className="p-2 bg-black/60 rounded-full">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text-tertiary text-sm">
                        S{episode.season_number}E{episode.episode_number}
                      </span>
                      <h4 className="font-medium text-text-primary truncate">
                        {episode.episode_title || `第${episode.episode_number}集`}
                      </h4>
                    </div>
                  </div>

                  {episode.file_size && (
                    <span className="flex-shrink-0 text-xs text-text-tertiary">
                      {formatFileSize(episode.file_size)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
