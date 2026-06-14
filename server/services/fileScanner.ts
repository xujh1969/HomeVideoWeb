import fs from 'fs-extra'
import path from 'path'
import { db } from '../db'
import { VIDEO_EXTS } from '../../shared/constants'
import { parseFilename, parseDirName, parseEpisodeName } from './filenameParser'
import type { MovieSource } from '../../shared/types'

export interface ScanResult {
  moviesFound: number
  seriesFound: number
  episodesFound: number
  errors: string[]
}

export function scanSource(source: MovieSource, batchId: number): ScanResult {
  const result: ScanResult = {
    moviesFound: 0,
    seriesFound: 0,
    episodesFound: 0,
    errors: [],
  }

  let basePath = source.address
  if (source.directory) {
    basePath = path.join(basePath, source.directory)
  }

  try {
    if (!fs.pathExistsSync(basePath)) {
      result.errors.push(`路径不存在: ${basePath}`)
      return result
    }

    const entries = fs.readdirSync(basePath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(basePath, entry.name)

      if (entry.isDirectory()) {
        const dirResult = scanDirectory(fullPath, batchId)
        if (dirResult.isSeries) {
          result.seriesFound++
          result.episodesFound += dirResult.episodeCount
        }
      } else if (entry.isFile()) {
        if (isVideoFile(entry.name)) {
          addOrUpdateMovie(fullPath, batchId)
          result.moviesFound++
        }
      }
    }
  } catch (err) {
    result.errors.push(`扫描错误: ${(err as Error).message}`)
  }

  return result
}

function scanDirectory(dirPath: string, batchId: number): { isSeries: boolean; episodeCount: number } {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const videoFiles = entries.filter(e => e.isFile() && isVideoFile(e.name))

    if (videoFiles.length >= 2) {
      addOrUpdateSeries(dirPath, videoFiles, batchId)
      return { isSeries: true, episodeCount: videoFiles.length }
    } else if (videoFiles.length === 1) {
      addOrUpdateMovie(path.join(dirPath, videoFiles[0].name), batchId)
      return { isSeries: false, episodeCount: 1 }
    }
  } catch {
    // ignore
  }
  return { isSeries: false, episodeCount: 0 }
}

function isVideoFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return VIDEO_EXTS.includes(ext as typeof VIDEO_EXTS[number])
}

function addOrUpdateMovie(filePath: string, batchId: number): void {
  const stat = fs.statSync(filePath)
  const parsed = parseFilename(path.basename(filePath))
  const now = new Date().toISOString()

  // 检查是否已存在
  const existingStmt = db.prepare('SELECT id, metadata_status FROM movies WHERE file_path = ?')
  const existing = existingStmt.get(filePath) as { id: number; metadata_status: string } | undefined

  if (existing) {
    // 已存在：只更新文件信息和batch_id，不删除元数据
    const updateStmt = db.prepare(`
      UPDATE movies SET 
        file_size = ?, file_mtime = ?, ext = ?,
        filename_rating = ?, filename_genre = ?, title_cn = ?, title_en = ?,
        batch_id = ?, updated_at = ?
      WHERE id = ?
    `)
    updateStmt.run(
      stat.size,
      stat.mtime.toISOString(),
      parsed.ext,
      parsed.rating,
      parsed.genre,
      parsed.titleCN,
      parsed.titleEN,
      batchId,
      now,
      existing.id
    )
  } else {
    // 新增电影
    const insertStmt = db.prepare(`
      INSERT INTO movies (
        file_path, file_size, file_mtime, ext,
        filename_rating, filename_genre, title_cn, title_en,
        metadata_status, batch_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `)
    insertStmt.run(
      filePath,
      stat.size,
      stat.mtime.toISOString(),
      parsed.ext,
      parsed.rating,
      parsed.genre,
      parsed.titleCN,
      parsed.titleEN,
      batchId,
      now
    )
  }
}

function addOrUpdateSeries(dirPath: string, videoFiles: fs.Dirent[], batchId: number): void {
  const dirName = path.basename(dirPath)
  const parsed = parseDirName(dirName)
  const now = new Date().toISOString()

  // 检查是否已存在
  const existingStmt = db.prepare('SELECT id, metadata_status FROM series WHERE dir_path = ?')
  const existing = existingStmt.get(dirPath) as { id: number; metadata_status: string } | undefined

  let seriesId: number

  if (existing) {
    // 已存在：只更新基本信息，不删除元数据
    const updateStmt = db.prepare(`
      UPDATE series SET 
        season_count = ?, episode_count = ?,
        filename_rating = ?, filename_genre = ?, title_cn = ?, title_en = ?, season_label = ?,
        batch_id = ?, updated_at = ?
      WHERE id = ?
    `)
    updateStmt.run(
      parsed.seasonNumber,
      videoFiles.length,
      parsed.rating,
      parsed.genre,
      parsed.titleCN,
      parsed.titleEN,
      parsed.seasonLabel,
      batchId,
      now,
      existing.id
    )
    seriesId = existing.id
  } else {
    // 新增连续剧
    const insertStmt = db.prepare(`
      INSERT INTO series (
        dir_path, season_count, episode_count,
        filename_rating, filename_genre, title_cn, title_en, season_label,
        metadata_status, batch_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `)
    const result = insertStmt.run(
      dirPath,
      parsed.seasonNumber,
      videoFiles.length,
      parsed.rating,
      parsed.genre,
      parsed.titleCN,
      parsed.titleEN,
      parsed.seasonLabel,
      batchId,
      now
    )
    seriesId = result.lastInsertRowid as number
  }

  // 更新剧集
  for (const file of videoFiles) {
    addOrUpdateEpisode(seriesId, dirPath, file.name, parsed.seasonNumber, batchId)
  }
}

function addOrUpdateEpisode(seriesId: number, dirPath: string, filename: string, defaultSeason: number, batchId: number): void {
  const filePath = path.join(dirPath, filename)
  const stat = fs.statSync(filePath)
  const parsed = parseEpisodeName(filename, defaultSeason)
  const now = new Date().toISOString()

  // 检查是否已存在
  const existingStmt = db.prepare('SELECT id FROM episodes WHERE file_path = ?')
  const existing = existingStmt.get(filePath) as { id: number } | undefined

  if (existing) {
    // 已存在：只更新文件信息
    const updateStmt = db.prepare(`
      UPDATE episodes SET 
        file_size = ?, file_mtime = ?, ext = ?,
        season_number = ?, episode_number = ?,
        batch_id = ?, updated_at = ?
      WHERE id = ?
    `)
    updateStmt.run(
      stat.size,
      stat.mtime.toISOString(),
      parsed.ext,
      parsed.seasonNumber,
      parsed.episodeNumber,
      batchId,
      now,
      existing.id
    )
  } else {
    // 新增剧集
    const insertStmt = db.prepare(`
      INSERT INTO episodes (
        series_id, file_path, file_size, file_mtime, ext,
        season_number, episode_number, batch_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertStmt.run(
      seriesId,
      filePath,
      stat.size,
      stat.mtime.toISOString(),
      parsed.ext,
      parsed.seasonNumber,
      parsed.episodeNumber,
      batchId,
      now
    )
  }
}