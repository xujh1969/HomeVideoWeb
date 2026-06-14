import axios from 'axios'
import { OMDB_API_KEY } from '../config'

// 配置（所有 Key 均从 .env 文件读取，不内置任何 Key）
const DOUBAN_KEY = process.env.DOUBAN_API_KEY || ''
const DOUBAN_KEY2 = process.env.DOUBAN_API_KEY2 || ''
const OMDB_KEY = OMDB_API_KEY

export interface DoubanMovieDetail {
  id: string
  title: string
  original_title: string
  rating: {
    average: number
    numRaters: number
  }
  images: {
    small: string
    medium: string
    large: string
  }
  year: string
  genres: string[]
  directors: { name: string }[]
  casts: { name: string }[]
  summary: string
  aka: string[]
  countries: string[]
  durations: string[]
}

export interface MovieMetaResult {
  query: { titleCN: string; titleEN?: string }
  doubanId: string | null
  titleCN: string
  titleEN: string | null
  rating_douban: number | null
  votes_douban: number | null
  summary: string | null
  directors: string[]
  actors: string[]
  genres: string[]
  year: string | null
  duration: string | null
  countries: string[]
  poster: string | null
  aka: string[]
  imdbId: string | null
  rating_imdb: number | null
  votes_imdb: string | null
  sources: {
    douban: boolean
    omdb: boolean
  }
}

// ─── 豆瓣 API（必须用 POST，apikey 放 body）───

/** 搜索电影 */
async function doubanSearch(title: string, apikey: string = DOUBAN_KEY): Promise<any | null> {
  try {
    const { data } = await axios.post('https://api.douban.com/v2/movie/search', {
      q: title,
      count: 3,
      apikey
    }, { 
      timeout: 10000, 
      headers: { 'Content-Type': 'application/json' } 
    })

    if (!data?.subjects?.length) return null
    return data.subjects[0]
  } catch {
    return null
  }
}

/** 获取详情（评分、简介、导演、演员等） */
async function doubanDetail(subjectId: string, apikey: string = DOUBAN_KEY): Promise<any | null> {
  try {
    const { data } = await axios.post(`https://api.douban.com/v2/movie/subject/${subjectId}`, {
      apikey
    }, { 
      timeout: 10000, 
      headers: { 'Content-Type': 'application/json' } 
    })

    return data
  } catch {
    return null
  }
}

// ─── OMDb API ───

/**
 * 从豆瓣 aka 数组中提取英文片名
 */
function extractEnglishTitle(aka: string[] = [], originalTitle: string = ''): string | null {
  // 优先 original_title（如果是英文）
  if (originalTitle && /^[\x00-\x7F\s]+$/.test(originalTitle) && /[a-zA-Z]/.test(originalTitle)) {
    return originalTitle
  }
  // 从 aka 中找纯英文/数字的
  for (const alias of aka) {
    if (/^[\x00-\x7F\sⅠⅡⅢⅣⅤⅥ\-'&!.,():]+$/.test(alias) && /[a-zA-Z]{3,}/.test(alias)) {
      return alias.trim()
    }
  }
  return null
}

/** 获取 IMDB 评分（需要英文片名 + 年份验证） */
async function omdbSearch(titleEN: string, doubanYear: string | null = null): Promise<{
  imdbId: string
  imdbRating: number | null
  imdbVotes: string | null
  titleEN: string
} | null> {
  if (!titleEN) return null

  const romanMap: Record<string, string> = { 'Ⅰ':'I','Ⅱ':'II','Ⅲ':'III','Ⅳ':'IV','Ⅴ':'V','Ⅵ':'VI' }
  const asciiTitle = titleEN.replace(/[ⅠⅡⅢⅣⅤⅥ]/g, c => romanMap[c] || c)

  const titles = [titleEN]
  if (asciiTitle !== titleEN) titles.push(asciiTitle)

  for (const title of titles) {
    try {
      const { data } = await axios.get('http://www.omdbapi.com/', {
        params: { apikey: OMDB_KEY, t: title, type: 'movie' },
        timeout: 8000
      })
      if (data.Response === 'False') continue

      const omdbYear = parseInt(data.Year)
      const dbYear = doubanYear ? parseInt(doubanYear) : null
      if (dbYear && omdbYear && Math.abs(omdbYear - dbYear) > 1) {
        continue
      }

      return {
        imdbId: data.imdbID,
        imdbRating: parseFloat(data.imdbRating) || null,
        imdbVotes: data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
        titleEN: data.Title,
      }
    } catch { continue }
  }
  return null
}

// ─── 主函数 ───

export async function fetchMovieMeta(titleCN: string, titleEN: string = ''): Promise<MovieMetaResult> {
  console.log(`\n🔍 "${titleCN}"${titleEN ? ` (${titleEN})` : ''}`)

  // Step 1: 豆瓣搜索（POST）
  console.log(`  [1/3] 豆瓣搜索...`)
  let searchResult = await doubanSearch(titleCN)
  
  if (!searchResult) {
    console.log(`    主Key失败, 尝试备用Key...`)
    searchResult = await doubanSearch(titleCN, DOUBAN_KEY2)
  }

  if (!searchResult) {
    console.log(`    → 豆瓣未找到`)
    // 尝试用OMDb作为兜底
    const omdb = await omdbSearch(titleEN || titleCN).catch(() => null)
    return {
      query: { titleCN, titleEN },
      doubanId: null,
      titleCN,
      titleEN: omdb?.titleEN || titleEN || null,
      rating_douban: null,
      votes_douban: null,
      summary: null,
      directors: [],
      actors: [],
      genres: [],
      year: null,
      duration: null,
      countries: [],
      poster: omdb?.imdbId ? `https://img.omdbapi.com/?i=${omdb.imdbId}&apikey=${OMDB_KEY}` : null,
      aka: [],
      imdbId: omdb?.imdbId || null,
      rating_imdb: omdb?.imdbRating || null,
      votes_imdb: omdb?.imdbVotes || null,
      sources: {
        douban: false,
        omdb: !!omdb
      }
    }
  }

  const doubanId = searchResult.id
  console.log(`    → "${searchResult.title}" 评分 ${searchResult.rating?.average || '?'}`)

  // Step 2: 豆瓣详情（先拿到英文名和年份）
  console.log(`  [2/3] 获取豆瓣详情...`)
  const detail = await doubanDetail(doubanId) || await doubanDetail(doubanId, DOUBAN_KEY2)

  if (detail) {
    console.log(`    → 豆瓣: ${detail.rating?.average}/10 (${detail.ratings_count}票)`)
  }

  // Step 3: OMDb（用从豆瓣提取的英文名 + 年份校验）
  console.log(`  [3/3] 获取IMDB评分...`)
  const engTitle = extractEnglishTitle(detail?.aka || [], detail?.original_title || '') || titleEN
  const omdb = engTitle
    ? await omdbSearch(engTitle, detail?.year).catch(() => null)
    : null

  if (omdb) {
    console.log(`    → IMDB: ${omdb.imdbRating}/10 (${omdb.imdbVotes}票) via "${engTitle}"`)
  } else {
    console.log(`    → ${engTitle ? `OMDb未收录 "${engTitle}"` : '无英文片名，跳过OMDb'}`)
  }

  const result: MovieMetaResult = {
    query: { titleCN, titleEN },
    doubanId,
    titleCN: detail?.title || searchResult.title,
    titleEN: detail?.original_title || omdb?.titleEN || searchResult.original_title || null,
    rating_douban: detail?.rating?.average || searchResult.rating?.average || null,
    votes_douban: detail?.ratings_count || null,
    summary: detail?.summary || null,
    directors: detail?.directors?.map((d: { name: string }) => d.name) || [],
    actors: detail?.casts?.map((c: { name: string }) => c.name).slice(0, 8) || [],
    genres: detail?.genres || [],
    year: detail?.year || null,
    duration: detail?.durations?.[0] || null,
    countries: detail?.countries || [],
    poster: detail?.images?.large || searchResult.images?.large || null,
    aka: detail?.aka || [],
    imdbId: omdb?.imdbId || null,
    rating_imdb: omdb?.imdbRating || null,
    votes_imdb: omdb?.imdbVotes || null,
    sources: {
      douban: !!detail,
      omdb: !!omdb
    }
  }

  return result
}

// ─── 转换为数据库格式 ───

export function convertToMovieData(meta: MovieMetaResult): {
  title_cn: string
  title_en: string | null
  year: string | null
  runtime: string | null
  overview: string | null
  poster_url: string | null
  douban_rating: number | null
  imdb_rating: number | null
  vote_count: string | null
  genres: string
  directors: string
  cast: string
} {
  return {
    title_cn: meta.titleCN,
    title_en: meta.titleEN,
    year: meta.year,
    runtime: meta.duration,
    overview: meta.summary,
    poster_url: meta.poster,
    douban_rating: meta.rating_douban,
    imdb_rating: meta.rating_imdb,
    vote_count: meta.votes_douban?.toString() || meta.votes_imdb || null,
    genres: meta.genres.join(','),
    directors: meta.directors.join(','),
    cast: meta.actors.join(','),
  }
}