import { db } from '../db'
import fs from 'fs-extra'
import path from 'path'
import type { MovieSource, SourceInput } from '../../shared/types'

export function getAllSources(): MovieSource[] {
  const stmt = db.prepare('SELECT * FROM sources ORDER BY id')
  return stmt.all() as MovieSource[]
}

export function getSourceById(id: number): MovieSource | undefined {
  const stmt = db.prepare('SELECT * FROM sources WHERE id = ?')
  return stmt.get(id) as MovieSource | undefined
}

export function addSource(input: SourceInput): number {
  const stmt = db.prepare(`
    INSERT INTO sources (name, source_type, address, port, username, password, directory, mount_point, enabled, scan_interval)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    input.name,
    input.source_type,
    input.address,
    input.port ?? null,
    input.username ?? null,
    input.password ?? null,
    input.directory,
    input.mount_point ?? null,
    input.enabled !== false ? 1 : 0,
    input.scan_interval ?? 3600
  )
  return result.lastInsertRowid as number
}

export function updateSource(id: number, input: Partial<SourceInput>): boolean {
  const fields: string[] = []
  const values: any[] = []

  if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name) }
  if (input.source_type !== undefined) { fields.push('source_type = ?'); values.push(input.source_type) }
  if (input.address !== undefined) { fields.push('address = ?'); values.push(input.address) }
  if (input.port !== undefined) { fields.push('port = ?'); values.push(input.port ?? null) }
  if (input.username !== undefined) { fields.push('username = ?'); values.push(input.username ?? null) }
  if (input.password !== undefined) { fields.push('password = ?'); values.push(input.password ?? null) }
  if (input.directory !== undefined) { fields.push('directory = ?'); values.push(input.directory) }
  if (input.mount_point !== undefined) { fields.push('mount_point = ?'); values.push(input.mount_point ?? null) }
  if (input.enabled !== undefined) { fields.push('enabled = ?'); values.push(input.enabled ? 1 : 0) }
  if (input.scan_interval !== undefined) { fields.push('scan_interval = ?'); values.push(input.scan_interval) }

  if (fields.length === 0) return false

  fields.push('updated_at = ?')
  values.push(new Date().toISOString(), id)

  const stmt = db.prepare(`UPDATE sources SET ${fields.join(', ')} WHERE id = ?`)
  const result = stmt.run(...values)
  return result.changes > 0
}

export function deleteSource(id: number): boolean {
  const stmt = db.prepare('DELETE FROM sources WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function updateSourceStatus(id: number, status: 'online' | 'offline' | 'error' | 'unknown', errorMessage?: string): void {
  const stmt = db.prepare('UPDATE sources SET status = ?, error_message = ?, updated_at = ? WHERE id = ?')
  stmt.run(status, errorMessage || null, new Date().toISOString(), id)
}

export function updateSourceLastScan(id: number, timestamp: string): void {
  const stmt = db.prepare('UPDATE sources SET last_scan_at = ? WHERE id = ?')
  stmt.run(timestamp, id)
}

export function getEnabledSources(): MovieSource[] {
  const stmt = db.prepare('SELECT * FROM sources WHERE enabled = 1 ORDER BY id')
  return stmt.all() as MovieSource[]
}

/**
 * 测试电影源配置（无需保存到数据库）
 */
export function testSourceConfig(config: SourceInput): { status: string; message: string } {
  try {
    let basePath = config.address

    // 处理挂载点
    if (config.mount_point) {
      basePath = config.mount_point
    }

    // 添加目录
    if (config.directory) {
      basePath = path.join(basePath, config.directory)
    }

    // 检查路径是否存在
    if (!fs.pathExistsSync(basePath)) {
      return { status: 'offline', message: '路径不存在或无法访问' }
    }

    // 读取目录内容
    const entries = fs.readdirSync(basePath)
    const videoExts = ['.mkv', '.mp4', '.avi', '.webm', '.ts', '.mov', '.wmv']
    const videoCount = entries.filter(e => videoExts.includes(path.extname(e).toLowerCase())).length

    return {
      status: 'online',
      message: `连接成功，发现 ${entries.length} 个文件，其中 ${videoCount} 个视频文件`
    }
  } catch (err) {
    return { status: 'error', message: (err as Error).message }
  }
}