import axios from 'axios'
import fs from 'fs-extra'
import path from 'path'
import { db } from '../db'
import { POSTER_DIR } from '../config'
import { fetchMovieMeta, MovieMetaResult } from './movieMetadataService'
import type { Movie, Series } from '../../shared/types'

let progressCallback: ((data: {
  currentTitle?: string
  currentType?: 'movie' | 'series'
  completed?: number
  total?: number
  success?: number
  failed?: number
}) => void) | null = null

export function setProgressCallback(cb: typeof progressCallback) {
  progressCallback = cb
}

export function getMetadataProgress(): { movies: number; series: number } {
  const movieStmt = db.prepare("SELECT COUNT(*) as count FROM movies WHERE metadata_status = 'pending'")
  const movieResult = movieStmt.get() as { count: number }

  const seriesStmt = db.prepare("SELECT COUNT(*) as count FROM series WHERE metadata_status = 'pending'")
  const seriesResult = seriesStmt.get() as { count: number }

  return { movies: movieResult.count, series: seriesResult.count }
}

export function getTotalPendingCount(): number {
  const movieStmt = db.prepare("SELECT COUNT(*) as count FROM movies WHERE metadata_status = 'pending'")
  const movieResult = movieStmt.get() as { count: number }

  const seriesStmt = db.prepare("SELECT COUNT(*) as count FROM series WHERE metadata_status = 'pending'")
  const seriesResult = seriesStmt.get() as { count: number }

  return movieResult.count + seriesResult.count
}

export async function fetchMovieMetadata(movieId: number): Promise<boolean> {
  const stmt = db.prepare('SELECT * FROM movies WHERE id = ?')
  const movie = stmt.get(movieId) as Movie | undefined
  
  if (!movie) return false

  const title = movie.title_cn || movie.title_en || ''
  if (!title) return false

  console.log(`\n[Metadata] Processing movie: ${title}`)
  progressCallback?.({
    currentTitle: title,
    currentType: 'movie'
  })

  try {
    const meta = await fetchMovieMeta(title, movie.title_en || '')
    const now = new Date().toISOString()

    if (!meta) {
      console.log(`[Metadata] All sources failed for: ${title}`)
      progressCallback?.({ failed: 1 })
      const updateStmt = db.prepare('UPDATE movies SET metadata_status = ?, metadata_updated = ? WHERE id = ?')
      updateStmt.run('failed', now, movieId)
      return false
    }

    updateMovieFromMeta(movieId, meta)

    if (meta.poster) {
      downloadPosterFromUrl(meta.poster, `movie_${movieId}.jpg`, movieId, 'movie')
    }

    const updateStmt = db.prepare('UPDATE movies SET metadata_status = ?, metadata_updated = ? WHERE id = ?')
    updateStmt.run('fetched', now, movieId)

    console.log(`[Metadata] Success for: ${title}`)
    progressCallback?.({ success: 1 })
    return true

  } catch (err) {
    console.error(`[Metadata] Error processing movie "${title}":`, (err as Error).message)
    progressCallback?.({ failed: 1 })
    const now = new Date().toISOString()
    const updateStmt = db.prepare('UPDATE movies SET metadata_status = ?, metadata_updated = ? WHERE id = ?')
    updateStmt.run('failed', now, movieId)
    return false
  }
}

export async function fetchSeriesMetadata(seriesId: number): Promise<boolean> {
  const stmt = db.prepare('SELECT * FROM series WHERE id = ?')
  const series = stmt.get(seriesId) as Series | undefined

  if (!series) return false

  const title = series.title_cn || series.title_en || ''
  if (!title) return false

  console.log(`\n[Metadata] Processing series: ${title}`)
  progressCallback?.({
    currentTitle: title,
    currentType: 'series'
  })

  try {
    const meta = await fetchMovieMeta(title, series.title_en || '')
    const now = new Date().toISOString()

    if (!meta) {
      console.log(`[Metadata] All sources failed for: ${title}`)
      progressCallback?.({ failed: 1 })
      const updateStmt = db.prepare('UPDATE series SET metadata_status = ?, metadata_updated = ? WHERE id = ?')
      updateStmt.run('failed', now, seriesId)
      return false
    }

    updateSeriesFromMeta(seriesId, meta)

    if (meta.poster) {
      downloadPosterFromUrl(meta.poster, `series_${seriesId}.jpg`, seriesId, 'series')
    }

    const updateStmt = db.prepare('UPDATE series SET metadata_status = ?, metadata_updated = ? WHERE id = ?')
    updateStmt.run('fetched', now, seriesId)

    console.log(`[Metadata] Success for series: ${title}`)
    progressCallback?.({ success: 1 })
    return true

  } catch (err) {
    console.error(`[Metadata] Error processing series "${title}":`, (err as Error).message)
    progressCallback?.({ failed: 1 })
    const now = new Date().toISOString()
    const updateStmt = db.prepare('UPDATE series SET metadata_status = ?, metadata_updated = ? WHERE id = ?')
    updateStmt.run('failed', now, seriesId)
    return false
  }
}

function updateMovieFromMeta(movieId: number, meta: MovieMetaResult): void {
  const stmt = db.prepare(`
    UPDATE movies SET
      title_cn = ?, title_en = ?, release_date = ?, runtime = ?,
      overview = ?, poster_path = ?, douban_rating = ?, imdb_rating = ?,
      vote_count = ?, genres = ?, director = ?, cast = ?
    WHERE id = ?
  `)
  
  const runtimeMinutes = meta.duration ? parseInt(meta.duration.replace(/[^\d]/g, '')) : null
  
  stmt.run(
    meta.titleCN,
    meta.titleEN || null,
    meta.year || null,
    runtimeMinutes,
    meta.summary || null,
    meta.poster || null,
    meta.rating_douban || null,
    meta.rating_imdb || null,
    meta.votes_douban || meta.votes_imdb || null,
    meta.genres.join(','),
    meta.directors.join(','),
    meta.actors.join(','),
    movieId
  )
}

function updateSeriesFromMeta(seriesId: number, meta: MovieMetaResult): void {
  const stmt = db.prepare(`
    UPDATE series SET
      title_cn = ?, title_en = ?, first_air_date = ?,
      overview = ?, poster_path = ?, douban_rating = ?, imdb_rating = ?,
      vote_count = ?, genres = ?, director = ?, cast = ?
    WHERE id = ?
  `)
  
  stmt.run(
    meta.titleCN,
    meta.titleEN || null,
    meta.year || null,
    meta.summary || null,
    meta.poster || null,
    meta.rating_douban || null,
    meta.rating_imdb || null,
    meta.votes_douban || meta.votes_imdb || null,
    meta.genres.join(','),
    meta.directors.join(','),
    meta.actors.join(','),
    seriesId
  )
}

function downloadPosterFromUrl(posterUrl: string, filename: string, mediaId: number, mediaType: 'movie' | 'series'): void {
  try {
    fs.ensureDirSync(POSTER_DIR)
    
    console.log(`[Metadata] Downloading poster from: ${posterUrl}`)
    
    // 判断图片来源，豆瓣需要特殊的 Referer 头
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    if (posterUrl.includes('doubanio.com')) {
      headers['Referer'] = 'https://movie.douban.com/'
    }
    
    axios.get(posterUrl, { 
      responseType: 'arraybuffer', 
      timeout: 10000,
      headers,
    }).then(response => {
      const outputPath = path.join(POSTER_DIR, filename)
      fs.writeFileSync(outputPath, Buffer.from(response.data))
      
      const localPosterPath = `/api/posters/${filename}`
      
      if (mediaType === 'movie') {
        const stmt = db.prepare('UPDATE movies SET local_poster = ? WHERE id = ?')
        stmt.run(localPosterPath, mediaId)
      } else {
        const stmt = db.prepare('UPDATE series SET local_poster = ? WHERE id = ?')
        stmt.run(localPosterPath, mediaId)
      }
      
      console.log(`[Metadata] Poster saved: ${filename}`)
    }).catch(err => {
      console.error(`[Metadata] Failed to download poster:`, err.message)
    })
  } catch (err) {
    console.error(`[Metadata] Failed to download poster:`, (err as Error).message)
  }
}

export async function fetchAllPendingMetadata(batchId: number): Promise<void> {
  // 只获取指定批次的待处理项
  const movieStmt = db.prepare("SELECT id, title_cn, title_en FROM movies WHERE metadata_status = 'pending' AND batch_id = ?")
  const pendingMovies = movieStmt.all(batchId) as { id: number; title_cn: string; title_en: string }[]

  const seriesStmt = db.prepare("SELECT id, title_cn, title_en FROM series WHERE metadata_status = 'pending' AND batch_id = ?")
  const pendingSeries = seriesStmt.all(batchId) as { id: number; title_cn: string; title_en: string }[]

  const total = pendingMovies.length + pendingSeries.length
  let completed = 0
  let success = 0
  let failed = 0

  console.log(`\n[Metadata] Starting metadata fetch for batch ${batchId}: ${pendingMovies.length} movies, ${pendingSeries.length} series, total ${total}`)
  progressCallback?.({ total, completed: 0, success: 0, failed: 0 })

  for (const movie of pendingMovies) {
    const result = await fetchMovieMetadata(movie.id)
    completed++
    if (result) success++; else failed++
    progressCallback?.({ total, completed, success, failed })
  }

  for (const series of pendingSeries) {
    const result = await fetchSeriesMetadata(series.id)
    completed++
    if (result) success++; else failed++
    progressCallback?.({ total, completed, success, failed })
  }

  console.log(`\n[Metadata] Completed: ${success} success, ${failed} failed out of ${total}`)
  progressCallback?.({ total, completed: total, success, failed })
}

/**
 * 批量下载所有缺失海报的电影海报
 * 用于修复之前因豆瓣 Referer 缺失导致的海报下载失败问题
 */
export async function downloadAllMissingPosters(): Promise<{ total: number; success: number; failed: number }> {
  // 获取所有有 poster_path 但没有 local_poster 的电影
  const movieStmt = db.prepare(`
    SELECT id, title_cn, title_en, poster_path 
    FROM movies 
    WHERE poster_path IS NOT NULL AND poster_path != '' 
    AND (local_poster IS NULL OR local_poster = '')
  `)
  const moviesWithoutPoster = movieStmt.all() as { id: number; title_cn: string; title_en: string; poster_path: string }[]
  
  // 获取所有有 poster_path 但没有 local_poster 的剧集
  const seriesStmt = db.prepare(`
    SELECT id, title_cn, title_en, poster_path 
    FROM series 
    WHERE poster_path IS NOT NULL AND poster_path != '' 
    AND (local_poster IS NULL OR local_poster = '')
  `)
  const seriesWithoutPoster = seriesStmt.all() as { id: number; title_cn: string; title_en: string; poster_path: string }[]

  const total = moviesWithoutPoster.length + seriesWithoutPoster.length
  let success = 0
  let failed = 0

  console.log(`\n[Poster] Starting batch poster download: ${moviesWithoutPoster.length} movies, ${seriesWithoutPoster.length} series, total ${total}`)

  // 处理电影海报
  for (const movie of moviesWithoutPoster) {
    try {
      console.log(`[Poster] Downloading for movie: ${movie.title_cn || movie.title_en}`)
      downloadPosterFromUrl(movie.poster_path, `movie_${movie.id}.jpg`, movie.id, 'movie')
      // 等待一下，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500))
      success++
    } catch (err) {
      console.error(`[Poster] Failed for movie ${movie.id}:`, (err as Error).message)
      failed++
    }
  }

  // 处理剧集海报
  for (const series of seriesWithoutPoster) {
    try {
      console.log(`[Poster] Downloading for series: ${series.title_cn || series.title_en}`)
      downloadPosterFromUrl(series.poster_path, `series_${series.id}.jpg`, series.id, 'series')
      await new Promise(resolve => setTimeout(resolve, 500))
      success++
    } catch (err) {
      console.error(`[Poster] Failed for series ${series.id}:`, (err as Error).message)
      failed++
    }
  }

  console.log(`\n[Poster] Completed: ${success} success, ${failed} failed out of ${total}`)
  return { total, success, failed }
}