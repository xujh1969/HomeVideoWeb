import express from 'express'
import { db } from '../db'
import { DEFAULT_PAGE_SIZE } from '../config'
import { fetchSeriesMetadata } from '../services/metadataFetcher'
import type { Series, Episode, MediaCardData } from '../../shared/types'

const router = express.Router()

router.get('/cards', (req, res) => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || DEFAULT_PAGE_SIZE.toString())

  const query = `
    SELECT 
      id, 
      'series' as type, 
      title_cn, 
      title_en, 
      search_key,
      filename_rating, 
      filename_genre,
      imdb_rating,
      douban_rating,
      local_poster,
      first_air_date as release_date,
      episode_count,
      season_label
    FROM series
    ORDER BY filename_rating DESC
    LIMIT ? OFFSET ?
  `

  const stmt = db.prepare(query)
  const series = stmt.all(limit, (page - 1) * limit) as MediaCardData[]
  res.json(series)
})

router.get('/', (req, res) => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || DEFAULT_PAGE_SIZE.toString())
  const genre = req.query.genre as string | undefined
  const sort = (req.query.sort as string) || 'rating_desc'
  const search = req.query.search as string | undefined

  let query = 'SELECT * FROM series'
  const params: any[] = []
  const whereClauses: string[] = []

  if (genre && genre !== '全部') {
    whereClauses.push('filename_genre = ?')
    params.push(genre)
  }

  if (search) {
    whereClauses.push('(title_cn LIKE ? OR title_en LIKE ? OR search_key LIKE ?)')
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
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
  const series = stmt.all(...params) as Series[]

  res.json({
    total: count.count,
    page,
    limit,
    series,
  })
})

router.get('/:id', (req, res) => {
  const { id } = req.params
  const seriesStmt = db.prepare('SELECT * FROM series WHERE id = ?')
  const series = seriesStmt.get(id) as Series | undefined

  if (!series) {
    return res.status(404).json({ error: 'Series not found' })
  }

  const episodeStmt = db.prepare('SELECT * FROM episodes WHERE series_id = ? ORDER BY season_number, episode_number')
  const episodes = episodeStmt.all(id) as Episode[]

  const seasons = episodes.reduce((acc: any[], episode) => {
    const season = acc.find(s => s.season_number === episode.season_number)
    if (!season) {
      acc.push({ season_number: episode.season_number, episodes: [episode] })
    } else {
      season.episodes.push(episode)
    }
    return acc
  }, [])

  res.json({
    ...series,
    seasons,
  })
})

router.post('/:id/fetch-metadata', async (req, res) => {
  const { id } = req.params
  const success = await fetchSeriesMetadata(parseInt(id))
  res.json({ ok: success })
})

router.patch('/episodes/:id', (req, res) => {
  const { id } = req.params
  const { watched, progress } = req.body

  const fields: string[] = []
  const values: any[] = []

  if (watched !== undefined) { fields.push('watched = ?'); values.push(watched) }
  if (progress !== undefined) { fields.push('progress = ?'); values.push(progress) }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }

  fields.push('updated_at = ?')
  values.push(new Date().toISOString(), id)

  const stmt = db.prepare(`UPDATE episodes SET ${fields.join(', ')} WHERE id = ?`)
  const result = stmt.run(...values)

  if (result.changes > 0) {
    res.json({ ok: true })
  } else {
    res.status(404).json({ error: 'Episode not found' })
  }
})

export default router