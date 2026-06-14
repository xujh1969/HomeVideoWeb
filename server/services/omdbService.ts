import axios from 'axios'
import { OMDB_API_KEY, OMDB_BASE_URL } from '../config'

export interface OMDBResponse {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: { Source: string; Value: string }[]
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
}

export async function getMovieByTitle(title: string): Promise<OMDBResponse | null> {
  if (!OMDB_API_KEY) {
    console.log('[OMDb] API Key not configured')
    return null
  }
  
  try {
    console.log(`[OMDb] Searching by title: ${title}`)
    const response = await axios.get(OMDB_BASE_URL, {
      params: {
        apikey: OMDB_API_KEY,
        t: title,
        type: 'movie',
      },
      timeout: 8000,
    })
    
    if (response.data.Response === 'True') {
      console.log(`[OMDb] Found: ${response.data.Title}`)
      return response.data
    } else {
      console.log(`[OMDb] Not found for title: ${title}, Error: ${response.data.Error}`)
      return null
    }
  } catch (err) {
    console.error(`[OMDb] Error fetching by title "${title}":`, (err as Error).message)
    return null
  }
}

export async function getMovieByImdbId(imdbId: string): Promise<OMDBResponse | null> {
  if (!OMDB_API_KEY) {
    console.log('[OMDb] API Key not configured')
    return null
  }
  
  try {
    console.log(`[OMDb] Searching by IMDB ID: ${imdbId}`)
    const response = await axios.get(OMDB_BASE_URL, {
      params: {
        apikey: OMDB_API_KEY,
        i: imdbId,
      },
      timeout: 8000,
    })
    
    if (response.data.Response === 'True') {
      console.log(`[OMDb] Found: ${response.data.Title}`)
      return response.data
    } else {
      console.log(`[OMDb] Not found for IMDB ID: ${imdbId}, Error: ${response.data.Error}`)
      return null
    }
  } catch (err) {
    console.error(`[OMDb] Error fetching by IMDB ID "${imdbId}":`, (err as Error).message)
    return null
  }
}

export function extractImdbRating(response: OMDBResponse): number | null {
  if (response && response.imdbRating && response.imdbRating !== 'N/A') {
    return parseFloat(response.imdbRating)
  }
  return null
}

export function extractImdbVoteCount(response: OMDBResponse): number | null {
  if (response && response.imdbVotes && response.imdbVotes !== 'N/A') {
    const numStr = response.imdbVotes.replace(/,/g, '')
    return parseInt(numStr, 10) || null
  }
  return null
}