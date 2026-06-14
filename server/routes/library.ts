import express from 'express'
import { getEnabledSources } from '../services/sourceManager'
import { scanSource } from '../services/fileScanner'
import { fetchAllPendingMetadata, setProgressCallback, downloadAllMissingPosters } from '../services/metadataFetcher'
import { db } from '../db'

const router = express.Router()

interface RefreshProgress {
  status: 'idle' | 'scanning' | 'cleaning' | 'metadata' | 'done' | 'error'
  progress: {
    current_source: string
    found_movies: number
    found_series: number
    found_episodes: number
    removed_movies: number
    removed_series: number
    removed_episodes: number
    errors: string[]
    metadata_current_title: string
    metadata_current_type: 'movie' | 'series'
    metadata_completed: number
    metadata_total: number
    metadata_success: number
    metadata_failed: number
  }
}

let refreshProgress: RefreshProgress = {
  status: 'idle',
  progress: {
    current_source: '',
    found_movies: 0,
    found_series: 0,
    found_episodes: 0,
    removed_movies: 0,
    removed_series: 0,
    removed_episodes: 0,
    errors: [],
    metadata_current_title: '',
    metadata_current_type: 'movie',
    metadata_completed: 0,
    metadata_total: 0,
    metadata_success: 0,
    metadata_failed: 0,
  },
}

let currentBatchId = 0

setProgressCallback((data) => {
  if (data.currentTitle !== undefined) refreshProgress.progress.metadata_current_title = data.currentTitle
  if (data.currentType !== undefined) refreshProgress.progress.metadata_current_type = data.currentType
  if (data.completed !== undefined) refreshProgress.progress.metadata_completed = data.completed
  if (data.total !== undefined) refreshProgress.progress.metadata_total = data.total
  if (data.success !== undefined) refreshProgress.progress.metadata_success = data.success
  if (data.failed !== undefined) refreshProgress.progress.metadata_failed = data.failed
})

/**
 * 生成新的批次号
 */
function generateBatchId(): number {
  // 获取当前最大批次号
  const movieResult = db.prepare('SELECT MAX(batch_id) as max_id FROM movies').get() as { max_id: number | null }
  const seriesResult = db.prepare('SELECT MAX(batch_id) as max_id FROM series').get() as { max_id: number | null }

  const maxMovieId = movieResult.max_id || 0
  const maxSeriesId = seriesResult.max_id || 0
  const maxBatchId = Math.max(maxMovieId, maxSeriesId)

  return maxBatchId + 1
}

/**
 * 清理不再存在的文件（批次号不是当前批次的记录）
 */
function cleanupRemovedFiles(batchId: number): { moviesRemoved: number; seriesRemoved: number; episodesRemoved: number } {
  // 删除电影（batch_id 不等于当前批次）
  const deleteMovies = db.prepare('DELETE FROM movies WHERE batch_id != ? AND batch_id != 0')
  const movieResult = deleteMovies.run(batchId)
  const moviesRemoved = movieResult.changes

  // 删除剧集（batch_id 不等于当前批次）
  const deleteSeries = db.prepare('DELETE FROM series WHERE batch_id != ? AND batch_id != 0')
  const seriesResult = deleteSeries.run(batchId)
  const seriesRemoved = seriesResult.changes

  // 删除集数（对应的剧集已删除，级联删除）
  // 注意：由于外键约束，episodes 会随着 series 的删除而自动删除
  // 但如果有独立的 episodes 表，需要单独处理
  const deleteEpisodes = db.prepare('DELETE FROM episodes WHERE batch_id != ? AND batch_id != 0')
  const episodeResult = deleteEpisodes.run(batchId)
  const episodesRemoved = episodeResult.changes

  return { moviesRemoved, seriesRemoved, episodesRemoved }
}

router.post('/refresh', (req, res) => {
  if (refreshProgress.status !== 'idle') {
    return res.json({ taskId: 'refresh_in_progress', status: refreshProgress.status })
  }

  // 生成新的批次号
  currentBatchId = generateBatchId()
  console.log(`[Library] Starting refresh with batch_id: ${currentBatchId}`)

  refreshProgress = {
    status: 'scanning',
    progress: {
      current_source: '',
      found_movies: 0,
      found_series: 0,
      found_episodes: 0,
      removed_movies: 0,
      removed_series: 0,
      removed_episodes: 0,
      errors: [],
      metadata_current_title: '',
      metadata_current_type: 'movie',
      metadata_completed: 0,
      metadata_total: 0,
      metadata_success: 0,
      metadata_failed: 0,
    },
  }

  const taskId = `refresh_${Date.now()}`

  setTimeout(async () => {
    try {
      const sources = getEnabledSources()

      for (const source of sources) {
        refreshProgress.progress.current_source = source.name
        const result = scanSource(source, currentBatchId)
        refreshProgress.progress.found_movies += result.moviesFound
        refreshProgress.progress.found_series += result.seriesFound
        refreshProgress.progress.found_episodes += result.episodesFound
        refreshProgress.progress.errors.push(...result.errors)
      }

      refreshProgress.status = 'cleaning'

      // 清理不再存在的文件（batch_id 不是当前批次的记录）
      const cleanupResult = cleanupRemovedFiles(currentBatchId)
      refreshProgress.progress.removed_movies = cleanupResult.moviesRemoved
      refreshProgress.progress.removed_series = cleanupResult.seriesRemoved
      refreshProgress.progress.removed_episodes = cleanupResult.episodesRemoved

      console.log(`[Library] Cleanup completed: ${cleanupResult.moviesRemoved} movies, ${cleanupResult.seriesRemoved} series, ${cleanupResult.episodesRemoved} episodes removed`)

      refreshProgress.status = 'metadata'

      // 获取待获取元数据的数量（当前批次中）
      const movieStmt = db.prepare("SELECT COUNT(*) as count FROM movies WHERE metadata_status = 'pending' AND batch_id = ?")
      const movieCount = (movieStmt.get(currentBatchId) as { count: number }).count

      const seriesStmt = db.prepare("SELECT COUNT(*) as count FROM series WHERE metadata_status = 'pending' AND batch_id = ?")
      const seriesCount = (seriesStmt.get(currentBatchId) as { count: number }).count

      refreshProgress.progress.metadata_total = movieCount + seriesCount

      // 只获取当前批次的待处理项
      await fetchAllPendingMetadata(currentBatchId)

      refreshProgress.status = 'done'
      console.log(`[Library] Refresh completed for batch ${currentBatchId}`)
    } catch (err) {
      refreshProgress.status = 'error'
      refreshProgress.progress.errors.push((err as Error).message)
      console.error('[Library] Refresh error:', err)
    }
  }, 100)

  res.json({ taskId, status: 'started' })
})

router.get('/refresh/status', (req, res) => {
  res.json(refreshProgress)
})

// 批量下载缺失的海报
router.post('/posters/download', async (req, res) => {
  try {
    const result = await downloadAllMissingPosters()
    res.json({
      success: true,
      message: `海报下载完成: ${result.success} 成功, ${result.failed} 失败`,
      total: result.total,
      downloaded: result.success,
      failed: result.failed
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: (err as Error).message
    })
  }
})

export default router