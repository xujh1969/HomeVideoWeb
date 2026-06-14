import axios from 'axios'
import { TMDB_API_KEY, TMDB_BASE_URL } from '../config'

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  release_date: string
  runtime: number
  vote_average: number
  vote_count: number
  poster_path: string
  genres: { id: number; name: string }[]
  credits?: {
    crew: { name: string; job: string }[]
    cast: { name: string; character: string }[]
  }
  imdb_id?: string
}

export interface TMDBTVShow {
  id: number
  name: string
  original_name: string
  overview: string
  first_air_date: string
  vote_average: number
  vote_count: number
  poster_path: string
  genres: { id: number; name: string }[]
  seasons: { season_number: number; episode_count: number }[]
}

export interface TMDBEpisode {
  id: number
  episode_number: number
  name: string
  overview: string
  season_number: number
}

export async function searchMovie(query: string): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) return null
  
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        language: 'zh-CN',
      },
    })
    
    if (response.data.results.length > 0) {
      return response.data.results[0]
    }
    return null
  } catch {
    return null
  }
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) return null
  
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'zh-CN',
        append_to_response: 'credits',
      },
    })
    return response.data
  } catch {
    return null
  }
}

export async function searchTVShow(query: string): Promise<TMDBTVShow | null> {
  if (!TMDB_API_KEY) return null
  
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        language: 'zh-CN',
      },
    })
    
    if (response.data.results.length > 0) {
      return response.data.results[0]
    }
    return null
  } catch {
    return null
  }
}

export async function getTVShowDetails(tvId: number): Promise<TMDBTVShow | null> {
  if (!TMDB_API_KEY) return null
  
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'zh-CN',
      },
    })
    return response.data
  } catch {
    return null
  }
}

export async function getTVSeasonEpisodes(tvId: number, seasonNumber: number): Promise<TMDBEpisode[] | null> {
  if (!TMDB_API_KEY) return null
  
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'zh-CN',
      },
    })
    return response.data.episodes
  } catch {
    return null
  }
}

export function getPosterUrl(posterPath: string, size: string = 'w342'): string {
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}
