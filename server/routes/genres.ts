import express from 'express'
import { db } from '../db'

const router = express.Router()

router.get('/', (req, res) => {
  const movieStmt = db.prepare('SELECT DISTINCT filename_genre FROM movies WHERE filename_genre IS NOT NULL')
  const movieGenres = movieStmt.all() as { filename_genre: string }[]

  const seriesStmt = db.prepare('SELECT DISTINCT filename_genre FROM series WHERE filename_genre IS NOT NULL')
  const seriesGenres = seriesStmt.all() as { filename_genre: string }[]

  const genres = new Set<string>()
  movieGenres.forEach((g) => genres.add(g.filename_genre))
  seriesGenres.forEach((g) => genres.add(g.filename_genre))

  res.json({ genres: Array.from(genres) })
})

router.get('/stats', (req, res) => {
  // 获取电影总数
  const movieCountStmt = db.prepare('SELECT COUNT(*) as count FROM movies')
  const movieCount = movieCountStmt.get() as { count: number }

  // 获取连续剧总数
  const seriesCountStmt = db.prepare('SELECT COUNT(*) as count FROM series')
  const seriesCount = seriesCountStmt.get() as { count: number }

  // 获取电影分类统计
  const movieGenreStatsStmt = db.prepare(`
    SELECT filename_genre, COUNT(*) as count 
    FROM movies 
    WHERE filename_genre IS NOT NULL 
    GROUP BY filename_genre 
    ORDER BY count DESC
  `)
  const movieGenreStats = movieGenreStatsStmt.all() as { filename_genre: string; count: number }[]

  // 获取连续剧分类统计
  const seriesGenreStatsStmt = db.prepare(`
    SELECT filename_genre, COUNT(*) as count 
    FROM series 
    WHERE filename_genre IS NOT NULL 
    GROUP BY filename_genre 
    ORDER BY count DESC
  `)
  const seriesGenreStats = seriesGenreStatsStmt.all() as { filename_genre: string; count: number }[]

  res.json({
    movieTotal: movieCount.count,
    seriesTotal: seriesCount.count,
    movieGenres: Object.fromEntries(movieGenreStats.map((g) => [g.filename_genre, g.count])),
    seriesGenres: Object.fromEntries(seriesGenreStats.map((g) => [g.filename_genre, g.count])),
  })
})

export default router