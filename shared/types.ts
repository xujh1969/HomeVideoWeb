export interface Movie {
  id: number
  file_path: string
  file_size: number | null
  file_mtime: string | null
  ext: string

  filename_rating: number | null
  filename_genre: string | null
  title_cn: string | null
  title_en: string | null

  tmdb_id: number | null
  overview: string | null
  release_date: string | null
  runtime: number | null
  director: string | null
  cast: string | null
  poster_path: string | null
  local_poster: string | null
  genres: string | null

  tmdb_rating: number | null
  imdb_rating: number | null
  douban_rating: number | null
  vote_count: number | null

  metadata_status: 'pending' | 'fetched' | 'failed'
  metadata_updated: string | null
  created_at: string
  updated_at: string
}

export interface Series {
  id: number
  dir_path: string
  season_count: number
  episode_count: number

  filename_rating: number | null
  filename_genre: string | null
  title_cn: string | null
  title_en: string | null
  season_label: string | null

  tmdb_id: number | null
  overview: string | null
  first_air_date: string | null
  poster_path: string | null
  local_poster: string | null
  genres: string | null

  tmdb_rating: number | null
  imdb_rating: number | null
  douban_rating: number | null
  vote_count: number | null

  metadata_status: 'pending' | 'fetched' | 'failed'
  metadata_updated: string | null
  created_at: string
  updated_at: string
}

export interface Episode {
  id: number
  series_id: number
  file_path: string
  file_size: number | null
  file_mtime: string | null
  ext: string
  season_number: number
  episode_number: number
  episode_title: string | null
  watched: number
  progress: number
  created_at: string
  updated_at: string
}

export interface ParsedFilename {
  rating: number | null
  genre: string | null
  titleCN: string | null
  titleEN: string | null
  ext: string
}

export interface ParsedDirName {
  rating: number | null
  genre: string | null
  titleCN: string | null
  titleEN: string | null
  seasonLabel: string | null
  seasonNumber: number
}

export interface ParsedEpisodeName {
  seasonNumber: number
  episodeNumber: number
  ext: string
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  limit: number
  data: T[]
}

export interface MovieListParams {
  page: number
  limit: number
  genre?: string
  sort?: 'rating_desc' | 'rating_asc' | 'date_desc' | 'title_asc'
  search?: string
}

export type MediaType = 'movie' | 'series'

export interface MediaCardData {
  id: number
  type: MediaType
  title_cn: string | null
  title_en: string | null
  filename_rating: number | null
  filename_genre: string | null
  imdb_rating: number | null
  douban_rating: number | null
  local_poster: string | null
  release_date: string | null
  runtime: number | null
  episode_count?: number
  season_label?: string
}

export interface MovieSource {
  id: number
  name: string
  source_type: 'smb' | 'local' | 'nfs'
  address: string
  port: number | null
  username: string | null
  password: string | null
  directory: string
  mount_point: string | null
  enabled: number
  scan_interval: number
  last_scan_at: string | null
  status: 'online' | 'offline' | 'error' | 'unknown'
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface SourceInput {
  name: string
  source_type: 'smb' | 'local' | 'nfs'
  address: string
  port?: number
  username?: string
  password?: string
  directory: string
  mount_point?: string
  enabled?: boolean
  scan_interval?: number
}

export interface WatchHistoryItem {
  id: number
  media_type: 'movie' | 'episode'
  media_id: number
  series_id: number | null
  watched_at: string
  progress: number
  title_cn?: string | null
  title_en?: string | null
  local_poster?: string | null
  episode_number?: number
  season_number?: number
}

export interface PaginatedMedia {
  total: number
  page: number
  limit: number
  items: MediaCardData[]
}

export interface HomePageData {
  hero: MediaCardData | null
  recentlyWatched: WatchHistoryItem[]
  latestAdditions: MediaCardData[]
  library: PaginatedMedia
}
