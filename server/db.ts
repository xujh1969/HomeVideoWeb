import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs-extra'
import { DB_PATH } from './config'

const dbDir = path.dirname(DB_PATH)
fs.ensureDirSync(dbDir)

export const db = new Database(DB_PATH)

// 数据库迁移
function runMigrations(): void {
  // 检查 batch_id 列是否存在，如果存在则更新 NULL 值为 0
  try {
    const result = db.prepare("SELECT COUNT(*) as count FROM movies WHERE batch_id IS NULL").get() as { count: number }
    if (result.count > 0) {
      db.exec("UPDATE movies SET batch_id = 0 WHERE batch_id IS NULL")
      console.log(`[DB] Updated ${result.count} movies with NULL batch_id to 0`)
    }
  } catch (e: any) {
    // 列不存在，忽略
  }

  try {
    const result = db.prepare("SELECT COUNT(*) as count FROM series WHERE batch_id IS NULL").get() as { count: number }
    if (result.count > 0) {
      db.exec("UPDATE series SET batch_id = 0 WHERE batch_id IS NULL")
      console.log(`[DB] Updated ${result.count} series with NULL batch_id to 0`)
    }
  } catch (e: any) {
    // 列不存在，忽略
  }

  try {
    const result = db.prepare("SELECT COUNT(*) as count FROM episodes WHERE batch_id IS NULL").get() as { count: number }
    if (result.count > 0) {
      db.exec("UPDATE episodes SET batch_id = 0 WHERE batch_id IS NULL")
      console.log(`[DB] Updated ${result.count} episodes with NULL batch_id to 0`)
    }
  } catch (e: any) {
    // 列不存在，忽略
  }

  // 添加 batch_id 列（如果不存在）
  try {
    db.exec("ALTER TABLE movies ADD COLUMN batch_id INTEGER DEFAULT 0")
    db.exec("UPDATE movies SET batch_id = 0 WHERE batch_id IS NULL")
    console.log('[DB] Added batch_id column to movies table')
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      console.error('[DB] Migration error for movies:', e.message)
    }
  }

  try {
    db.exec("ALTER TABLE series ADD COLUMN batch_id INTEGER DEFAULT 0")
    db.exec("UPDATE series SET batch_id = 0 WHERE batch_id IS NULL")
    console.log('[DB] Added batch_id column to series table')
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      console.error('[DB] Migration error for series:', e.message)
    }
  }

  try {
    db.exec("ALTER TABLE episodes ADD COLUMN batch_id INTEGER DEFAULT 0")
    db.exec("UPDATE episodes SET batch_id = 0 WHERE batch_id IS NULL")
    console.log('[DB] Added batch_id column to episodes table')
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      console.error('[DB] Migration error for episodes:', e.message)
    }
  }

  // 添加 search_key 列（用于拼音首字母搜索）
  try {
    db.exec("ALTER TABLE movies ADD COLUMN search_key TEXT")
    console.log('[DB] Added search_key column to movies table')
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      console.error('[DB] Migration error for movies search_key:', e.message)
    }
  }

  try {
    db.exec("ALTER TABLE series ADD COLUMN search_key TEXT")
    console.log('[DB] Added search_key column to series table')
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      console.error('[DB] Migration error for series search_key:', e.message)
    }
  }

  // 创建 search_key 索引
  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_movies_search_key ON movies(search_key)")
    db.exec("CREATE INDEX IF NOT EXISTS idx_series_search_key ON series(search_key)")
    console.log('[DB] Created search_key indexes')
  } catch (e: any) {
    console.error('[DB] Error creating search_key indexes:', e.message)
  }
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL UNIQUE,
      file_size INTEGER,
      file_mtime TEXT,
      ext TEXT NOT NULL,
      filename_rating REAL,
      filename_genre TEXT,
      title_cn TEXT,
      title_en TEXT,
      tmdb_id INTEGER,
      overview TEXT,
      release_date TEXT,
      runtime INTEGER,
      director TEXT,
      cast TEXT,
      poster_path TEXT,
      local_poster TEXT,
      genres TEXT,
      tmdb_rating REAL,
      imdb_rating REAL,
      douban_rating REAL,
      vote_count TEXT,
      metadata_status TEXT DEFAULT 'pending',
      metadata_updated TEXT,
      batch_id INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(filename_genre);
    CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(filename_rating DESC);
    CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title_cn);

    CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dir_path TEXT NOT NULL UNIQUE,
      season_count INTEGER DEFAULT 1,
      episode_count INTEGER DEFAULT 0,
      filename_rating REAL,
      filename_genre TEXT,
      title_cn TEXT,
      title_en TEXT,
      season_label TEXT,
      tmdb_id INTEGER,
      overview TEXT,
      first_air_date TEXT,
      director TEXT,
      cast TEXT,
      poster_path TEXT,
      local_poster TEXT,
      genres TEXT,
      tmdb_rating REAL,
      imdb_rating REAL,
      douban_rating REAL,
      vote_count TEXT,
      metadata_status TEXT DEFAULT 'pending',
      metadata_updated TEXT,
      batch_id INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_series_genre ON series(filename_genre);
    CREATE INDEX IF NOT EXISTS idx_series_rating ON series(filename_rating DESC);
    CREATE INDEX IF NOT EXISTS idx_series_title ON series(title_cn);

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      file_size INTEGER,
      file_mtime TEXT,
      ext TEXT NOT NULL,
      season_number INTEGER NOT NULL DEFAULT 1,
      episode_number INTEGER NOT NULL,
      episode_title TEXT,
      watched INTEGER DEFAULT 0,
      progress REAL DEFAULT 0,
      batch_id INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_episodes_series ON episodes(series_id, season_number, episode_number);
    CREATE INDEX IF NOT EXISTS idx_episodes_file ON episodes(file_path);

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'smb',
      address TEXT NOT NULL,
      port INTEGER,
      username TEXT,
      password TEXT,
      directory TEXT NOT NULL,
      mount_point TEXT,
      enabled INTEGER DEFAULT 1,
      scan_interval INTEGER DEFAULT 3600,
      last_scan_at TEXT,
      status TEXT DEFAULT 'unknown',
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_type TEXT NOT NULL,
      media_id INTEGER NOT NULL,
      series_id INTEGER,
      watched_at TEXT DEFAULT (datetime('now')),
      progress REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_watch_history_media ON watch_history(media_type, media_id);
    CREATE INDEX IF NOT EXISTS idx_watch_history_time ON watch_history(watched_at DESC);
  `)

  // 运行数据库迁移
  runMigrations()

  console.log('Database initialized successfully')
}