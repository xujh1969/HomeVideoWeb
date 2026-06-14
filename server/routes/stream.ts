import express from 'express'
import fs from 'fs'
import path from 'path'
import { db } from '../db'
import { DIRECT_PLAY_EXTS } from '../../shared/constants'
import type { Movie, Episode } from '../../shared/types'

const router = express.Router()

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.ts': 'video/mp2t',
    '.wmv': 'video/x-ms-wmv',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

router.get('/movie/:id/direct', (req, res) => {
  const { id } = req.params
  const stmt = db.prepare('SELECT * FROM movies WHERE id = ?')
  const movie = stmt.get(id) as Movie | undefined

  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' })
  }

  if (!DIRECT_PLAY_EXTS.includes(movie.ext as typeof DIRECT_PLAY_EXTS[number])) {
    return res.status(400).json({ error: 'Format not supported for direct play' })
  }

  const filePath = movie.file_path

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }

  const stat = fs.statSync(filePath)
  const fileSize = stat.size
  const range = req.headers.range
  const mimeType = getMimeType(movie.ext)

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunksize = end - start + 1
    const file = fs.createReadStream(filePath, { start, end })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimeType,
    }
    res.writeHead(206, head)
    file.pipe(res)
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
    }
    res.writeHead(200, head)
    fs.createReadStream(filePath).pipe(res)
  }
})

router.get('/episode/:id/direct', (req, res) => {
  const { id } = req.params
  const stmt = db.prepare('SELECT * FROM episodes WHERE id = ?')
  const episode = stmt.get(id) as Episode | undefined

  if (!episode) {
    return res.status(404).json({ error: 'Episode not found' })
  }

  if (!DIRECT_PLAY_EXTS.includes(episode.ext as typeof DIRECT_PLAY_EXTS[number])) {
    return res.status(400).json({ error: 'Format not supported for direct play' })
  }

  const filePath = episode.file_path

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }

  const stat = fs.statSync(filePath)
  const fileSize = stat.size
  const range = req.headers.range
  const mimeType = getMimeType(episode.ext)

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunksize = end - start + 1
    const file = fs.createReadStream(filePath, { start, end })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimeType,
    }
    res.writeHead(206, head)
    file.pipe(res)
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
    }
    res.writeHead(200, head)
    fs.createReadStream(filePath).pipe(res)
  }
})

export default router