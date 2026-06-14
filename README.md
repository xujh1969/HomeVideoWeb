<p align="center">
  <img src="https://img.icons8.com/fluency/96/video-projector.png" alt="HomeVideoWeb" width="96" />
</p>

<h1 align="center">家庭影视平台 · HomeVideoWeb</h1>

<p align="center">
  一个自托管的家庭影视媒体库管理系统，支持自动刮削元数据、多源扫描、在线播放与搜索。
  <br />
  灵感来源于网易爆米花风格，专为本地媒体收藏设计。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
</p>

---

## 目录

- [主要功能](#主要功能)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [目录结构](#目录结构)
- [API 概览](#api-概览)
- [文件名规范](#文件名规范)
- [媒体源配置](#媒体源配置)
- [构建部署](#构建部署)
- [技术栈](#技术栈)

---

## 主要功能

### 📚 多源媒体库管理

支持 **本地磁盘**、**SMB 共享**、**NFS 共享** 等多种来源的影片扫描与管理。智能增量扫描，自动识别新增/移除的文件，扫描进度实时反馈。

### 🏷️ 智能文件名解析

自动解析符合以下规范的文件名，提取评分、分类、标题等信息：

```
【8.5】【动作】利刃出鞘.mp4
【9.2】【剧情】肖申克的救赎.1994.mp4
```

### 🌐 自动元数据刮削

支持多个数据源自动获取元数据：

- **TMDB** — 海报、简介、演员信息
- **OMDb** — IMDb 评分
- **豆瓣** — 中文评分与简介

元数据获取状态实时展示，支持对单条或多条记录手动刷新。

### 🎬 在线播放

支持主流视频格式的浏览器端直接播放：

- MP4 / WebM / MOV / AVI 等格式 **浏览器原生支持**
- 基于 **Range Request** 的分段流式播放，支持进度拖拽
- 自定义播放器界面：播放/暂停、音量、全屏、进度条

### 📺 连续剧管理

支持多季多集的连续剧目录结构，智能识别季/集编号，提供分季浏览和一键播放。

### 🔍 搜索与筛选

- **分类筛选** — 按剧情、动作、科幻等分类浏览
- **评分排序** — 按评分从高到低/从低到高排序
- **中文拼音搜索** — 支持中文、英文及拼音首字母搜索（如搜索 `lrcq` 找到"利刃出鞘"）

### 📊 观看历史

自动记录观看进度，首页展示最近观看的影片，支持断点续播。

---

## 快速开始

### 前置条件

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 1. 克隆仓库
git clone https://github.com/xujh1969/HomeVideoWeb.git
cd HomeVideoWeb

# 2. 安装依赖
npm install
cd client && npm install && cd ..

# 3. 配置环境变量
cp .env.sample .env
# 编辑 .env 填入 API Key（至少填写一个元数据来源）

# 4. 启动开发服务器（前后端同时启动）
npm run dev
```

启动后：

- **后端 API**: http://localhost:3000
- **前端页面**: http://localhost:5173

> Windows 用户可直接双击运行 `start.bat`，自动完成依赖安装并启动服务。

### 首次使用

1. 打开前端页面（默认 http://localhost:5173）
2. 点击右上角 ⚙️ 进入**电影源管理**
3. 添加你的影片目录（本地路径或 SMB/NFS 共享地址）
4. 在设置页面点击**刷新媒体库**，等待扫描和元数据获取完成
5. 回到首页即可浏览影片

---

## 环境配置

参考 `.env.sample` 创建 `.env` 文件：

```env
# 服务端口
PORT=3000

# OMDb API Key（获取 IMDb 评分）
OMDB_API_KEY=your_key_here

# 豆瓣 API Key（获取中文元数据）
DOUBAN_API_KEY=your_key_here

# TMDB API Key（增强海报和元数据来源）
TMDB_API_KEY=your_key_here

# 数据库路径
DB_PATH=./data/movies.db

# 海报缓存目录
POSTER_DIR=./data/images
```

> **至少需要配置一个元数据来源**，否则影片将只能显示文件名解析到的信息。

---

## 目录结构

```
home-video-web/
├── client/                          # 前端 (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # 公共组件
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   └── RefreshProgressDialog.tsx
│   │   │   ├── home/                # 首页组件
│   │   │   │   ├── HeroBanner.tsx
│   │   │   │   ├── LatestAdditions.tsx
│   │   │   │   ├── RecentlyWatched.tsx
│   │   │   │   └── VideoCarousel.tsx
│   │   │   ├── layout/              # 布局组件
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── movie/               # 影片展示
│   │   │   │   ├── MediaCard.tsx
│   │   │   │   └── MediaGrid.tsx
│   │   │   └── settings/
│   │   │       └── SettingsDialog.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx         # 首页
│   │   │   ├── MovieDetailPage.tsx  # 电影详情
│   │   │   ├── SeriesDetailPage.tsx # 剧集详情
│   │   │   └── PlayerPage.tsx       # 全屏播放器
│   │   ├── utils/
│   │   │   ├── api.ts              # API 请求封装
│   │   │   └── pinyin.ts           # 拼音搜索工具
│   │   ├── App.tsx                 # 根组件（路由）
│   │   ├── main.tsx                # 入口文件
│   │   └── index.css               # Tailwind 样式
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # 后端 (Express + SQLite)
│   ├── routes/
│   │   ├── movies.ts               # 电影 API
│   │   ├── series.ts               # 剧集 API
│   │   ├── home.ts                 # 首页聚合 API
│   │   ├── library.ts              # 媒体库刷新 API
│   │   ├── sources.ts              # 电影源管理 API
│   │   ├── stream.ts               # 视频流 API
│   │   ├── posters.ts              # 海报服务 API
│   │   └── genres.ts               # 分类 API
│   ├── services/
│   │   ├── fileScanner.ts          # 文件扫描引擎
│   │   ├── filenameParser.ts       # 文件名解析器
│   │   ├── metadataFetcher.ts      # 元数据获取协调
│   │   ├── movieMetadataService.ts # 多源元数据聚合
│   │   ├── tmdbService.ts          # TMDB API 封装
│   │   ├── omdbService.ts          # OMDb API 封装
│   │   ├── doubanService.ts        # 豆瓣 API 封装
│   │   └── sourceManager.ts        # 电影源管理
│   ├── db.ts                       # 数据库初始化与迁移
│   ├── config.ts                   # 环境配置读取
│   └── index.ts                    # 服务入口
│
├── shared/                          # 前后端共享代码
│   ├── types.ts                    # TypeScript 类型定义
│   ├── constants.ts                # 常量定义
│   └── utils.ts                    # 工具函数
│
├── data/                            # 运行时数据
│   ├── images/                     # 海报图片缓存
│   └── movies.db                   # SQLite 数据库
│
├── .env.sample                     # 环境变量模板
├── start.bat                       # Windows 一键启动脚本
├── package.json                    # 后端依赖与脚本
└── README.md
```

---

## API 概览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/home` | GET | 首页数据（轮播、最近观看、最新添加） |
| `/api/home/recently-watched` | GET | 最近观看记录 |
| `/api/home/watch-history` | POST | 记录观看历史 |
| `/api/movies` | GET | 电影列表（支持分页、分类、排序、搜索） |
| `/api/movies/:id` | GET | 电影详情 |
| `/api/movies/:id/fetch-metadata` | POST | 手动刷新单条元数据 |
| `/api/series` | GET | 剧集列表 |
| `/api/series/:id` | GET | 剧集详情（含分季分集） |
| `/api/series/:id/fetch-metadata` | POST | 刷新剧集元数据 |
| `/api/stream/movie/:id/direct` | GET | 电影视频流（支持 Range） |
| `/api/stream/episode/:id/direct` | GET | 剧集视频流（支持 Range） |
| `/api/sources` | GET | 电影源列表 |
| `/api/sources` | POST | 添加电影源 |
| `/api/sources/:id` | PUT | 更新电影源配置 |
| `/api/sources/:id` | DELETE | 删除电影源 |
| `/api/library/refresh` | POST | 触发全库刷新扫描 |
| `/api/library/refresh/status` | GET | 刷新进度查询 |
| `/api/library/posters/download` | POST | 批量下载缺失海报 |
| `/api/genres` | GET | 获取所有分类 |
| `/api/posters/:filename` | GET | 获取海报图片 |

---

## 文件名规范

### 电影文件

推荐命名格式，以便自动提取评分、分类和标题：

```
【评分】【分类】中文名.英文名.年份.其他信息.扩展名
```

示例：

```
【9.3】【剧情】肖申克的救赎.The Shawshank Redemption.1994.1080p.mp4
【8.5】【动作】利刃出鞘.Knives Out.2019.mp4
【7.8】【科幻】月球.Moon.2009.BluRay.mkv
```

- `【评分】` — 用于排序和评分徽章显示
- `【分类】` — 用于左侧分类筛选
- 中英文标题 — 用于元数据刮削的搜索关键词

### 连续剧目录

```
连续剧名称【评分】【分类】/
├── Season 1/
│   ├── S01E01.mp4
│   ├── S01E02 集标题.mp4
│   └── ...
├── Season 2/
│   ├── S02E01.mp4
│   └── ...
└── ...
```

支持的集数命名格式：

- `S01E01.mp4` / `S01E01 标题.mp4`
- `1-01.mp4`（备用格式）

---

## 媒体源配置

支持三种类型的媒体源：

| 类型 | 说明 | 地址示例 |
|------|------|----------|
| `local` | 本地磁盘路径 | `D:\Movies` |
| `smb` | SMB/CIFS 网络共享 | `\\192.168.1.100\video` |
| `nfs` | NFS 网络共享 | `/mnt/nas/video` |

每个源支持配置：

- **扫描间隔** — 自动重新扫描的时间间隔（秒）
- **启用/禁用** — 临时关闭某个源而不删除配置
- **连接测试** — 验证源是否可达

---

## 构建部署

```bash
# 构建前端 + 后端
npm run build

# 启动生产服务（前端由 Express 静态文件托管）
npm start
```

生产部署后，访问 `http://your-server:3000` 即可使用完整功能。

---

## 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| [React 18](https://react.dev/) | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vite](https://vitejs.dev/) | 构建工具 |
| [Tailwind CSS 3](https://tailwindcss.com/) | 样式框架 |
| [React Router v6](https://reactrouter.com/) | 路由 |
| [lucide-react](https://lucide.dev/) | 图标库 |
| [pinyin](https://github.com/hotoo/pinyin) | 中文拼音搜索 |
| [axios](https://axios-http.com/) | HTTP 客户端 |

### 后端

| 技术 | 用途 |
|------|------|
| [Express](https://expressjs.com/) | Web 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite 数据库驱动 |
| [axios](https://axios-http.com/) | HTTP 客户端（元数据请求） |
| [fs-extra](https://github.com/jprichardson/node-fs-extra) | 文件系统扩展 |
| [nodemon](https://nodemon.io/) | 开发热重载 |

### 元数据来源

- [TMDB](https://www.themoviedb.org/) — 国际电影数据库（海报、简介、演员）
- [OMDb API](http://www.omdbapi.com/) — IMDb 评分
- [豆瓣](https://movie.douban.com/) — 中文评分与简介

---

## 许可证

本项目仅供个人学习和非商业用途。
