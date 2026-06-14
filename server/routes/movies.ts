import express from 'express'
import { db } from '../db'
import { DEFAULT_PAGE_SIZE } from '../config'
import { fetchMovieMetadata } from '../services/metadataFetcher'
import type { Movie, MediaCardData } from '../../shared/types'

const router = express.Router()

router.get('/', (req, res) => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || DEFAULT_PAGE_SIZE.toString())
  const genre = req.query.genre as string | undefined
  const sort = (req.query.sort as string) || 'rating_desc'
  const search = req.query.search as string | undefined

  let query = 'SELECT * FROM movies'
  const params: any[] = []
  const whereClauses: string[] = []

  if (genre && genre !== '全部') {
    whereClauses.push('filename_genre = ?')
    params.push(genre)
  }

  if (search) {
    whereClauses.push('(title_cn LIKE ? OR title_en LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ')
  }

  const sortMap: Record<string, string> = {
    rating_desc: 'filename_rating DESC',
    rating_asc: 'filename_rating ASC',
    date_desc: 'created_at DESC',
    title_asc: 'title_cn ASC',
  }
  query += ` ORDER BY ${sortMap[sort] || sortMap.rating_desc}`

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count')
  const countStmt = db.prepare(countQuery)
  const count = countStmt.get(...params) as { count: number }

  query += ' LIMIT ? OFFSET ?'
  params.push(limit, (page - 1) * limit)

  const stmt = db.prepare(query)
  const movies = stmt.all(...params) as Movie[]

  res.json({
    total: count.count,
    page,
    limit,
    movies,
  })
})

router.get('/:id', (req, res) => {
  const { id } = req.params
  const stmt = db.prepare('SELECT * FROM movies WHERE id = ?')
  const movie = stmt.get(id) as Movie | undefined

  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' })
  }

  res.json(movie)
})

router.post('/:id/fetch-metadata', async (req, res) => {
  const { id } = req.params
  const success = await fetchMovieMetadata(parseInt(id))
  res.json({ ok: success })
})

router.get('/cards', (req, res) => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || DEFAULT_PAGE_SIZE.toString())

  const query = `
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
    ORDER BY filename_rating DESC
    LIMIT ? OFFSET ?
  `

  const stmt = db.prepare(query)
  const movies = stmt.all(limit, (page - 1) * limit) as MediaCardData[]
  res.json(movies)
})

// 重试获取缺失海报的电影元数据
router.post('/retry-missing-posters', async (req, res) => {
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM movies WHERE (local_poster IS NULL OR local_poster = '') AND metadata_status = 'fetched'")
  const count = countStmt.get() as { count: number }
  
  // 将这些电影的 metadata_status 改为 pending 以便重新获取
  db.prepare("UPDATE movies SET metadata_status = 'pending' WHERE (local_poster IS NULL OR local_poster = '') AND metadata_status = 'fetched'").run()
  
  res.json({ 
    ok: true, 
    count: count.count,
    message: `已将 ${count.count} 部缺少海报的电影标记为待获取元数据，请刷新媒体库`
  })
})

export default router