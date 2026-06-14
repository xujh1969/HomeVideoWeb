import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

export const PORT = parseInt(process.env.PORT || '3000')
export const TMDB_API_KEY = process.env.TMDB_API_KEY || ''
export const OMDB_API_KEY = process.env.OMDB_API_KEY || ''

export const DB_PATH = process.env.DB_PATH || './data/movies.db'
export const POSTER_DIR = process.env.POSTER_DIR || './data/images'
export const HLS_DIR = process.env.HLS_DIR || './data/hls'

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
export const OMDB_BASE_URL = 'http://www.omdbapi.com'
export const DOUBAN_BASE_URL = 'https://movie.douban.com'

export const DEFAULT_PAGE_SIZE = 24
export const MAX_RECENTLY_WATCHED = 7
export const MAX_HERO_ITEMS = 10