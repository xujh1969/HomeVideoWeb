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

export default router