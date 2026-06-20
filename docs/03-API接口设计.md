# 家庭影视平台 - API 接口设计文档

## 一、API 概述

### 1.1 基本信息

| 属性 | 值 |
|------|-----|
| 基础URL | `/api` |
| 数据格式 | JSON |
| 认证方式 | 无（内网使用） |
| 跨域 | 已配置CORS |

### 1.2 路由挂载

| 前缀 | 路由文件 | 说明 |
|------|----------|------|
| `/api/home` | `routes/home.ts` | 首页数据 |
| `/api/movies` | `routes/movies.ts` | 电影相关 |
| `/api/series` | `routes/series.ts` | 剧集相关 |
| `/api/sources` | `routes/sources.ts` | 媒体源管理 |
| `/api/library` | `routes/library.ts` | 媒体库操作 |
| `/api/stream` | `routes/stream.ts` | 视频流服务 |
| `/api/posters` | `routes/posters.ts` | 海报图片 |
| `/api/genres` | `routes/genres.ts` | 分类统计 |

### 1.3 响应格式

**成功响应**:
```json
{
  "ok": true,
  "data": { ... }
}
```

**列表响应**:
```json
{
  "total": 100,
  "page": 1,
  "limit": 24,
  "items": [ ... ]
}
```

**错误响应**:
```json
{
  "error": "错误信息"
}
```

---

## 二、首页 API（/api/home）

### 2.1 GET /api/home
获取首页综合数据

**Query 参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 24 | 每页数量 |

**响应**:
```json
{
  "hero": {
    "id": 5654,
    "type": "movie",
    "title_cn": "挽救计划",
    "title_en": "Project Hail Mary",
    "search_key": "wjjhphm",
    "filename_rating": 8.3,
    "filename_genre": "冒险",
    "imdb_rating": 8.3,
    "douban_rating": 8.6,
    "local_poster": "/api/posters/movie_5654.jpg",
    "overview": "...",
    "release_date": "2026",
    "runtime": null
  },
  "recentlyWatched": [
    {
      "id": 1,
      "media_type": "movie",
      "media_id": 5654,
      "series_id": null,
      "watched_at": "2026-06-20T09:43:17.131Z",
      "progress": 0,
      "title_cn": "挽救计划",
      "title_en": "Project Hail Mary",
      "local_poster": "/api/posters/movie_5654.jpg",
      "filename_genre": "冒险",
      "filename_rating": 8.3,
      "imdb_rating": 8.3,
      "douban_rating": 8.6
    }
  ],
  "latestAdditions": [ /* MediaCardData[] */ ],
  "library": {
    "total": 886,
    "page": 1,
    "limit": 24,
    "items": [ /* MediaCardData[] */ ]
  }
}
```

---

### 2.2 GET /api/home/hero
获取首页轮播Hero数据（最近添加的电影）

**响应**: `MediaCardData | null`

---

### 2.3 GET /api/home/recently-watched
获取最近观看记录

**响应**: `WatchHistoryItem[]`

---

### 2.4 GET /api/home/latest
获取最新添加的电影

**Query 参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 24 | 每页数量 |

**响应**:
```json
{
  "total": 886,
  "page": 1,
  "limit": 24,
  "items": [ /* MediaCardData[] */ ]
}
```

---

### 2.5 POST /api/home/watch-history
更新观看历史

**请求体**:
```json
{
  "media_type": "movie" | "episode",
  "media_id": 5654,
  "series_id": null | 48,
  "progress": 0.35
}
```

**响应**: `{ "ok": true }`

---

## 三、电影 API（/api/movies）

### 3.1 GET /api/movies
获取电影列表（支持分页、筛选、搜索）

**Query 参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 24 | 每页数量 |
| genre | string | - | 筛选分类（"全部"时不筛选） |
| sort | string | "rating_desc" | 排序方式 |
| search | string | - | 搜索关键词 |

**sort 可选值**:
- `rating_desc`: 按评分降序
- `rating_asc`: 按评分升序
- `date_desc`: 按添加时间降序
- `title_asc`: 按标题升序

**响应**:
```json
{
  "total": 886,
  "page": 1,
  "limit": 24,
  "movies": [
    {
      "id": 5654,
      "file_path": "E:\\迅雷下载\\Movie\\挽救计划.mp4",
      "file_size": 3616110527,
      "file_mtime": "2026-06-20T08:34:22.391Z",
      "ext": ".mp4",
      "filename_rating": 8.3,
      "filename_genre": "冒险",
      "title_cn": "挽救计划",
      "title_en": "Project Hail Mary",
      "search_key": "wjjhphm",
      "overview": "...",
      "release_date": "2026",
      "runtime": null,
      "director": "菲尔·罗德,克里斯托弗·米勒",
      "cast": "瑞恩·高斯林,桑德拉·惠勒",
      "poster_path": "https://...",
      "local_poster": "/api/posters/movie_5654.jpg",
      "genres": "剧情,科幻,惊悚",
      "tmdb_rating": null,
      "imdb_rating": 8.3,
      "douban_rating": 8.6,
      "vote_count": 475615,
      "metadata_status": "fetched",
      "metadata_updated": "2026-06-20T08:40:16.529Z",
      "created_at": "2026-06-20 08:39:52",
      "updated_at": "2026-06-20 08:40:00.665Z"
    }
  ]
}
```

---

### 3.2 GET /api/movies/cards
获取电影卡片列表（简化数据，用于列表展示）

**Query 参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 24 | 每页数量 |

**响应**: `MediaCardData[]`

---

### 3.3 GET /api/movies/:id
获取单个电影详情

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 电影ID |

**响应**: `Movie` 或 404

---

### 3.4 POST /api/movies/:id/fetch-metadata
获取/更新电影元数据（从豆瓣/OMDb/TMDB）

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 电影ID |

**响应**: `{ "ok": boolean }`

---

### 3.5 POST /api/movies/retry-missing-posters
重试获取缺失海报的电影

**响应**:
```json
{
  "ok": true,
  "count": 10,
  "message": "已将 10 部缺少海报的电影标记为待获取元数据，请刷新媒体库"
}
```

---

## 四、剧集 API（/api/series）

### 4.1 GET /api/series
获取剧集列表

**Query 参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 24 | 每页数量 |
| genre | string | - | 筛选分类 |
| sort | string | "rating_desc" | 排序方式 |
| search | string | - | 搜索关键词 |

**响应**:
```json
{
  "total": 60,
  "page": 1,
  "limit": 24,
  "series": [ /* Series[] */ ]
}
```

---

### 4.2 GET /api/series/cards
获取剧集卡片列表

**响应**: `MediaCardData[]`

---

### 4.3 GET /api/series/:id
获取剧集详情（含所有季和集）

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 剧集ID |

**响应**:
```json
{
  "id": 48,
  "dir_path": "\\\\192.168.1.100\\video\\最后的舞动",
  "season_count": 1,
  "episode_count": 10,
  "title_cn": "最后的舞动",
  "title_en": null,
  "search_key": "zhdwd",
  "overview": "...",
  "first_air_date": "2020",
  "local_poster": "/api/posters/series_48.jpg",
  "genres": "纪录片,运动",
  "douban_rating": 9.6,
  "seasons": [
    {
      "season_number": 1,
      "episodes": [
        {
          "id": 396,
          "series_id": 48,
          "file_path": "...",
          "season_number": 1,
          "episode_number": 1,
          "episode_title": null,
          "watched": 0,
          "progress": 0
        }
      ]
    }
  ]
}
```

---

### 4.4 POST /api/series/:id/fetch-metadata
获取/更新剧集元数据

**响应**: `{ "ok": boolean }`

---

### 4.5 PATCH /api/series/episodes/:id
更新剧集集数的观看状态

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 集数ID |

**请求体**:
```json
{
  "watched": 1,
  "progress": 0.45
}
```

**响应**: `{ "ok": true }` 或 404

---

## 五、媒体源 API（/api/sources）

### 5.1 GET /api/sources
获取所有媒体源

**响应**:
```json
{
  "sources": [
    {
      "id": 1,
      "name": "我的影视",
      "source_type": "smb",
      "address": "192.168.1.100",
      "port": 445,
      "directory": "video",
      "enabled": 1,
      "status": "online",
      "last_scan_at": "2026-06-20T08:34:00.000Z"
    }
  ]
}
```

---

### 5.2 GET /api/sources/:id
获取单个媒体源详情

**响应**: `MovieSource` 或 404

---

### 5.3 POST /api/sources
添加新媒体源

**请求体**:
```json
{
  "name": "我的影视",
  "source_type": "smb",
  "address": "192.168.1.100",
  "port": 445,
  "username": "guest",
  "password": "",
  "directory": "video",
  "enabled": true,
  "scan_interval": 3600
}
```

**响应**: `{ "ok": true, "id": 2 }`

---

### 5.4 POST /api/sources/test-config
测试媒体源配置（不保存）

**请求体**: 同 5.3

**响应**:
```json
{
  "status": "success",
  "message": "连接成功"
}
```

---

### 5.5 PUT /api/sources/:id
更新媒体源

**响应**: `{ "ok": true }` 或 404

---

### 5.6 DELETE /api/sources/:id
删除媒体源

**响应**: `{ "ok": true }` 或 404

---

### 5.7 POST /api/sources/:id/test
测试媒体源连接

**响应**:
```json
{
  "status": "online",
  "message": "连接成功"
}
```

---

### 5.8 POST /api/sources/clear-library
清空整个媒体库

**响应**:
```json
{
  "ok": true,
  "message": "媒体库已清空"
}
```

---

## 六、媒体库 API（/api/library）

### 6.1 POST /api/library/refresh
触发媒体库刷新（扫描文件、清理、更新元数据）

**响应**:
```json
{
  "taskId": "abc123",
  "status": "started"
}
```

如果已在刷新中:
```json
{
  "taskId": "refresh_in_progress",
  "status": "scanning"
}
```

---

### 6.2 GET /api/library/refresh/status
获取媒体库刷新进度

**响应**:
```json
{
  "status": "metadata",
  "progress": {
    "current_source": "我的影视",
    "found_movies": 886,
    "found_series": 60,
    "found_episodes": 1245,
    "removed_movies": 5,
    "removed_episodes": 12,
    "errors": [],
    "metadata_current_title": "挽救计划",
    "metadata_current_type": "movie",
    "metadata_completed": 450,
    "metadata_total": 886,
    "metadata_success": 445,
    "metadata_failed": 5
  }
}
```

---

### 6.3 POST /api/library/posters/download
批量下载缺失的海报

**响应**:
```json
{
  "success": true,
  "message": "海报下载完成",
  "total": 100,
  "downloaded": 95,
  "failed": 5
}
```

---

## 七、视频流 API（/api/stream）

### 7.1 GET /api/stream/movie/:id/direct
电影直链流媒体播放

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 电影ID |

**支持格式**: `.mp4`, `.webm`, `.mkv`, `.avi`, `.mov`, `.ts`

**响应头**:
- `Content-Type`: 视频MIME类型
- `Content-Length`: 文件大小
- `Accept-Ranges`: `bytes`

**功能**:
- 支持 HTTP Range 请求（拖动进度条）
- 返回 206 Partial Content 或 200 OK

---

### 7.2 GET /api/stream/episode/:id/direct
剧集集数直链流媒体播放

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 集数ID |

**功能**: 同 7.1

---

## 八、海报 API（/api/posters）

### 8.1 GET /api/posters/:filename
获取海报图片

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| filename | string | 海报文件名（如 movie_5654.jpg） |

**响应**:
- 成功: 图片二进制数据，Content-Type: image/jpeg 或 image/png
- 失败: 404

---

## 九、分类 API（/api/genres）

### 9.1 GET /api/genres
获取所有分类（去重的电影和剧集类型合并）

**响应**:
```json
{
  "genres": ["全部", "动作", "喜剧", "剧情", "科幻", "纪录片", "恐怖", "爱情", "悬疑", "惊悚", "冒险", "动画"]
}
```

---

### 9.2 GET /api/genres/stats
获取分类统计

**响应**:
```json
{
  "movieTotal": 886,
  "seriesTotal": 60,
  "movieGenres": {
    "剧情": 180,
    "科幻": 120,
    "喜剧": 95,
    "纪录片": 88,
    "动作": 75
  },
  "seriesGenres": {
    "纪录片": 25,
    "剧情": 15,
    "科幻": 10,
    "喜剧": 5,
    "犯罪": 5
  }
}
```

---

## 十、API 端点汇总表

| 方法 | 路径 | 说明 |
|------|------|------|
| **首页** | | |
| GET | `/api/home` | 获取首页综合数据 |
| GET | `/api/home/hero` | 获取Hero数据 |
| GET | `/api/home/recently-watched` | 获取最近播放 |
| GET | `/api/home/latest` | 获取最新添加 |
| POST | `/api/home/watch-history` | 添加观看历史 |
| **电影** | | |
| GET | `/api/movies` | 获取电影列表 |
| GET | `/api/movies/cards` | 获取电影卡片 |
| GET | `/api/movies/:id` | 获取电影详情 |
| POST | `/api/movies/:id/fetch-metadata` | 获取电影元数据 |
| POST | `/api/movies/retry-missing-posters` | 重试缺失海报 |
| **剧集** | | |
| GET | `/api/series` | 获取剧集列表 |
| GET | `/api/series/cards` | 获取剧集卡片 |
| GET | `/api/series/:id` | 获取剧集详情 |
| POST | `/api/series/:id/fetch-metadata` | 获取剧集元数据 |
| PATCH | `/api/series/episodes/:id` | 更新集状态 |
| **媒体源** | | |
| GET | `/api/sources` | 获取所有源 |
| GET | `/api/sources/:id` | 获取源详情 |
| POST | `/api/sources` | 添加源 |
| POST | `/api/sources/test-config` | 测试源配置 |
| PUT | `/api/sources/:id` | 更新源 |
| DELETE | `/api/sources/:id` | 删除源 |
| POST | `/api/sources/:id/test` | 测试源连接 |
| POST | `/api/sources/clear-library` | 清空媒体库 |
| **媒体库** | | |
| POST | `/api/library/refresh` | 刷新媒体库 |
| GET | `/api/library/refresh/status` | 获取刷新进度 |
| POST | `/api/library/posters/download` | 下载海报 |
| **视频流** | | |
| GET | `/api/stream/movie/:id/direct` | 电影直链播放 |
| GET | `/api/stream/episode/:id/direct` | 剧集直链播放 |
| **海报** | | |
| GET | `/api/posters/:filename` | 获取海报图片 |
| **分类** | | |
| GET | `/api/genres` | 获取所有分类 |
| GET | `/api/genres/stats` | 获取分类统计 |

---

## 十一、共享类型定义

详见 `shared/types.ts` 文件:

### MediaCardData
```typescript
interface MediaCardData {
  id: number
  type: 'movie' | 'series'
  title_cn: string | null
  title_en: string | null
  search_key: string | null
  filename_rating: number | null
  filename_genre: string | null
  imdb_rating: number | null
  douban_rating: number | null
  local_poster: string | null
  release_date: string | null
  runtime: number | null
  episode_count?: number
  season_label?: string
}
```

### Movie
```typescript
interface Movie {
  id: number
  file_path: string
  title_cn: string | null
  title_en: string | null
  search_key: string | null
  ext: string
  filename_genre: string | null
  imdb_rating: number | null
  douban_rating: number | null
  local_poster: string | null
  overview: string | null
  // ... 更多字段
}
```

### Series
```typescript
interface Series {
  id: number
  dir_path: string
  title_cn: string | null
  title_en: string | null
  search_key: string | null
  season_count: number
  episode_count: number
  season_label: string | null
  local_poster: string | null
  // ... 更多字段
}
```

### Episode
```typescript
interface Episode {
  id: number
  series_id: number
  season_number: number
  episode_number: number
  episode_title: string | null
  watched: number
  progress: number
}
```

### MovieSource
```typescript
interface MovieSource {
  id: number
  name: string
  source_type: 'smb' | 'local' | 'nfs'
  address: string
  status: 'online' | 'offline' | 'error' | 'unknown'
}
```

### WatchHistoryItem
```typescript
interface WatchHistoryItem {
  id: number
  media_type: 'movie' | 'episode'
  media_id: number
  series_id: number | null
  watched_at: string
  progress: number
  title_cn?: string | null
  title_en?: string | null
  local_poster?: string | null
  episode_number?: number
  season_number?: number
  filename_genre?: string | null
  filename_rating?: number | null
  imdb_rating?: number | null
  douban_rating?: number | null
}
```
