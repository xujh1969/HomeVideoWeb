import express from 'express'
import { db } from '../db'
import { MAX_RECENTLY_WATCHED, DEFAULT_PAGE_SIZE } from '../config'
import type { MediaCardData, WatchHistoryItem } from '../../shared/types'

const router = express.Router()

router.get('/', (req, res) => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || DEFAULT_PAGE_SIZE.toString())

  const heroStmt = db.prepare(`
    SELECT 
      id, 
      'movie' as type, 
      title_cn, 
      title_en, 
      filename_rating, 
      filename_genre,
      imdb_rating,
      douban_rating,
      local_poster,
      overview,
      release_date,
      runtime
    FROM movies
    ORDER BY created_at DESC
    LIMIT 1
  `)
  const hero = heroStmt.get() as MediaCardData | undefined

  const recentlyWatchedStmt = db.prepare(`
    SELECT 
      wh.id,
      wh.media_type,
      wh.media_id,
      wh.series_id,
      wh.watched_at,
      wh.progress,
      COALESCE(m.title_cn, s.title_cn) as title_cn,
      COALESCE(m.title_en, s.title_en) as title_en,
      COALESCE(m.local_poster, s.local_poster) as local_poster,
      e.episode_number,
      e.season_number
    FROM watch_history wh
    LEFT JOIN movies m ON wh.media_type = 'movie' AND wh.media_id = m.id
    LEFT JOIN episodes e ON wh.media_type = 'episode' AND wh.media_id = e.id
    LEFT JOIN series s ON wh.series_id = s.id
    ORDER BY wh.watched_at DESC
    LIMIT ?
  `)
  const recentlyWatched = recentlyWatchedStmt.all(MAX_RECENTLY_WATCHED) as WatchHistoryItem[]

  const latestStmt = db.prepare(`
    SELECT 
      id, 
      'movie' as type, 
      title_cn, 
      title_en, 
      filename_rating, 
      filename_genre,
      imdb_rating,
      douban_rating,
      local_poster,
      release_date,
      runtime
    FROM movies
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  const latestAdditions = latestStmt.all(limit, 0) as MediaCardData[]

  const libraryStmt = db.prepare(`
    SELECT 
      id, 
      'movie' as type, 
      title_cn, 
      title_en, 
      filename_rating, 
      filename_genre,
      imdb_rating,
      douban_rating,
      local_poster,
      overview,
      ext,
      release_date,
      runtime
    FROM movies
    ORDER BY filename_rating DESC
    LIMIT ? OFFSET ?
  `)
  const library = libraryStmt.all(limit, (page - 1) * limit) as MediaCardData[]

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM movies')
  const count = countStmt.get() as { count: number }

  res.json({
    hero: hero || null,
    recentlyWatched,
    latestAdditions,
    library: {
      total: count.count,
      page,
      limit,
      items: library,
    },
  })
})

router.get('/hero', (req, res) => {
  const stmt = db.prepare(`
    SELECT 
      id, 
      'movie' as type, 
      title_cn, 
      title_en, 
      filename_rating, 
      filename_genre,
      imdb_rating,
      douban_rating,
      local_poster,
      overview,
      release_date,
      runtime
    FROM movies
    ORDER BY created_at DESC
    LIMIT 1
  `)
  const hero = stmt.get() as MediaCardData | undefined
  res.json(hero || null)
})

router.get('/recently-watched', (req, res) => {
  const stmt = db.prepare(`
    SELECT 
      wh.id,
      wh.media_type,
      wh.media_id,
      wh.series_id,
      wh.watched_at,
      wh.progress,
      COALESCE(m.title_cn, s.title_cn) as title_cn,
      COALESCE(m.title_en, s.title_en) as title_en,
      COALESCE(m.local_poster, s.local_poster) as local_poster,
      e.episode_number,
      e.season_number
    FROM watch_history wh
    LEFT JOIN movies m ON wh.media_type = 'movie' AND wh.media_id = m.id
    LEFT JOIN episodes e ON wh.media_type = 'episode' AND wh.media_id = e.id
    LEFT JOIN series s ON wh.series_id = s.id
    ORDER BY wh.watched_at DESC
    LIMIT ?
  `)
  const history = stmt.all(MAX_RECENTLY_WATCHED) as WatchHistoryItem[]
  res.json(history)
})

router.get('/latest', (req, res) => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || DEFAULT_PAGE_SIZE.toString())

  const stmt = db.prepare(`
    SELECT 
      id, 
      'movie' as type, 
      title_cn, 
      title_en, 
      filename_rating, 
      filename_genre,
      imdb_rating,
      douban_rating,
      local_poster,
      release_date,
      runtime
    FROM movies
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  const movies = stmt.all(limit, (page - 1) * limit) as MediaCardData[]

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM movies')
  const count = countStmt.get() as { count: number }

  res.json({
    total: count.count,
    page,
    limit,
    items: movies,
  })
})

router.post('/watch-history', (req, res) => {
  const { media_type, media_id, series_id, progress } = req.body
  const now = new Date().toISOString()

  const existingStmt = db.prepare('SELECT id FROM watch_history WHERE media_type = ? AND media_id = ?')
  const existing = existingStmt.get(media_type, media_id)

  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE watch_history
      SET watched_at = ?, progress = ?
      WHERE media_type = ? AND media_id = ?
    `)
    updateStmt.run(now, progress || 0, media_type, media_id)
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO watch_history (media_type, media_id, series_id, progress, watched_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    insertStmt.run(media_type, media_id, series_id || null, progress || 0, now)
  }

  res.json({ ok: true })
})

export default router