import express from 'express'
import fs from 'fs-extra'
import path from 'path'
import { db } from '../db'
import { getAllSources, getSourceById, addSource, updateSource, deleteSource, updateSourceStatus, testSourceConfig } from '../services/sourceManager'
import type { SourceInput } from '../../shared/types'

const router = express.Router()

router.get('/', (req, res) => {
  const sources = getAllSources()
  res.json({ sources })
})

router.get('/:id', (req, res) => {
  const { id } = req.params
  const source = getSourceById(parseInt(id))

  if (!source) {
    return res.status(404).json({ error: 'Source not found' })
  }

  res.json(source)
})

router.post('/', (req, res) => {
  const input = req.body as SourceInput
  const id = addSource(input)
  res.json({ ok: true, id })
})

// 测试配置（无需保存到数据库）
router.post('/test-config', (req, res) => {
  const config = req.body as SourceInput

  if (!config.address) {
    return res.json({ status: 'error', message: '请填写地址' })
  }

  const result = testSourceConfig(config)
  res.json(result)
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const input = req.body as Partial<SourceInput>
  const success = updateSource(parseInt(id), input)
  
  if (success) {
    res.json({ ok: true })
  } else {
    res.status(404).json({ error: 'Source not found' })
  }
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  const success = deleteSource(parseInt(id))
  
  if (success) {
    res.json({ ok: true })
  } else {
    res.status(404).json({ error: 'Source not found' })
  }
})

router.post('/clear-library', (req, res) => {
  try {
    db.exec('DELETE FROM watch_history')
    db.exec('DELETE FROM episodes')
    db.exec('DELETE FROM movies')
    db.exec('DELETE FROM series')
    
    res.json({ ok: true, message: '媒体库已清空' })
  } catch (err) {
    console.error('Failed to clear library:', err)
    res.status(500).json({ error: '清空失败' })
  }
})

router.post('/:id/test', (req, res) => {
  const { id } = req.params
  const source = getSourceById(parseInt(id))

  if (!source) {
    return res.status(404).json({ error: 'Source not found' })
  }

  try {
    let basePath = source.address
    if (source.directory) {
      basePath = path.join(basePath, source.directory)
    }

    if (!fs.pathExistsSync(basePath)) {
      updateSourceStatus(parseInt(id), 'error', '路径不存在')
      return res.json({ status: 'offline', message: '路径不存在' })
    }

    const entries = fs.readdirSync(basePath)
    const videoExts = ['.mkv', '.mp4', '.avi', '.webm', '.ts', '.mov', '.wmv']
    const videoCount = entries.filter(e => videoExts.includes(path.extname(e).toLowerCase())).length

    updateSourceStatus(parseInt(id), 'online')
    res.json({ 
      status: 'online', 
      message: `连接成功, 发现 ${entries.length} 个文件, 其中 ${videoCount} 个视频文件` 
    })
  } catch (err) {
    updateSourceStatus(parseInt(id), 'error', (err as Error).message)
    res.json({ status: 'error', message: (err as Error).message })
  }
})

export default router