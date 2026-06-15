import axios from 'axios'
import type { 
  Movie, 
  Series, 
  Episode, 
  MediaCardData, 
  WatchHistoryItem, 
  HomePageData, 
  MovieSource, 
  SourceInput 
} from '@shared/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export async function getHomeData(page: number = 1, limit: number = 24): Promise<HomePageData> {
  const response = await api.get('/home', { params: { page, limit } })
  return response.data
}

export async function getHeroData(): Promise<MediaCardData | null> {
  const response = await api.get('/home/hero')
  return response.data
}

export async function getRecentlyWatched(): Promise<WatchHistoryItem[]> {
  const response = await api.get('/home/recently-watched')
  return response.data
}

export async function getLatestAdditions(page: number = 1, limit: number = 24): Promise<{ total: number; page: number; limit: number; items: MediaCardData[] }> {
  const response = await api.get('/home/latest', { params: { page, limit } })
  return response.data
}

export async function addWatchHistory(mediaType: 'movie' | 'episode', mediaId: number, seriesId?: number, progress: number = 0): Promise<void> {
  await api.post('/home/watch-history', { media_type: mediaType, media_id: mediaId, series_id: seriesId, progress })
}

export async function getMovies(params: { page?: number; limit?: number; genre?: string; sort?: string; search?: string } = {}): Promise<{ total: number; page: number; limit: number; movies: Movie[] }> {
  const response = await api.get('/movies', { params })
  return response.data
}

export async function getMovieById(id: number): Promise<Movie> {
  const response = await api.get(`/movies/${id}`)
  return response.data
}

export async function fetchMovieMetadata(id: number): Promise<{ ok: boolean }> {
  const response = await api.post(`/movies/${id}/fetch-metadata`)
  return response.data
}

export async function getMovieCards(page: number = 1, limit: number = 24): Promise<MediaCardData[]> {
  const response = await api.get('/movies/cards', { params: { page, limit } })
  return response.data
}

export async function getSeries(params: { page?: number; limit?: number; genre?: string; sort?: string; search?: string } = {}): Promise<{ total: number; page: number; limit: number; series: Series[] }> {
  const response = await api.get('/series', { params })
  return response.data
}

export async function getSeriesById(id: number): Promise<Series & { seasons: { season_number: number; episodes: Episode[] }[] }> {
  const response = await api.get(`/series/${id}`)
  return response.data
}

export async function fetchSeriesMetadata(id: number): Promise<{ ok: boolean }> {
  const response = await api.post(`/series/${id}/fetch-metadata`)
  return response.data
}

export async function getSeriesCards(page: number = 1, limit: number = 24): Promise<MediaCardData[]> {
  const response = await api.get('/series/cards', { params: { page, limit } })
  return response.data
}

export async function updateEpisodeStatus(id: number, watched: number, progress: number): Promise<{ ok: boolean }> {
  const response = await api.patch(`/series/episodes/${id}`, { watched, progress })
  return response.data
}

export async function getSources(): Promise<{ sources: MovieSource[] }> {
  const response = await api.get('/sources')
  return response.data
}

export async function addSource(input: SourceInput): Promise<{ ok: boolean; id: number }> {
  const response = await api.post('/sources', input)
  return response.data
}

export async function updateSource(id: number, input: Partial<SourceInput>): Promise<{ ok: boolean }> {
  const response = await api.put(`/sources/${id}`, input)
  return response.data
}

export async function deleteSource(id: number): Promise<{ ok: boolean }> {
  const response = await api.delete(`/sources/${id}`)
  return response.data
}

export async function testSource(id: number): Promise<{ status: string; message: string }> {
  const response = await api.post(`/sources/${id}/test`)
  return response.data
}

export async function testSourceConfig(input: SourceInput): Promise<{ status: string; message: string }> {
  const response = await api.post('/sources/test-config', input)
  return response.data
}

export async function clearLibrary(): Promise<{ ok: boolean; message: string }> {
  const response = await api.post('/sources/clear-library')
  return response.data
}

export async function refreshLibrary(): Promise<{ taskId: string; status: string }> {
  const response = await api.post('/library/refresh')
  return response.data
}

export async function getRefreshStatus(): Promise<{ status: string; progress: { current_source: string; found_movies: number; found_series: number; found_episodes: number; removed_movies: number; removed_episodes: number; errors: string[] } }> {
  const response = await api.get('/library/refresh/status')
  return response.data
}

export async function getGenres(): Promise<{ genres: string[] }> {
  const response = await api.get('/genres')
  return response.data
}

export async function getGenreStats(): Promise<{ 
  movieTotal: number; 
  seriesTotal: number; 
  movieGenres: { [key: string]: number }; 
  seriesGenres: { [key: string]: number } 
}> {
  const response = await api.get('/genres/stats')
  return response.data
}
