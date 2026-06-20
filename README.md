<p align="center">
  <img src="https://img.icons8.com/fluency/96/video-projector.png" alt="HomeVideoWeb" width="96" />
</p>

<h1 align="center">家庭影视平台 · HomeVideoWeb</h1>

<p align="center">
  一个自托管的家庭影视媒体库管理系统，支持自动刮削元数据、多源扫描、在线播放与智能搜索。
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
- [技术文档](#技术文档)

---

![movie.png](https://github.com/xujh1969/HomeVideoWeb/blob/main/assets/movie.png?raw=true)

![detail.png](https://github.com/xujh1969/HomeVideoWeb/blob/main/assets/detail.png?raw=true)

![series.png](https://github.com/xujh1969/HomeVideoWeb/blob/main/assets/series.png?raw=true)

![search.png](https://github.com/xujh1969/HomeVideoWeb/blob/main/assets/search.png?raw=true)

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

- MP4 / WebM / MOV / AVI / MKV 等格式
- 基于 **Range Request** 的分段流式播放，支持进度拖拽
- 自定义播放器界面：播放/暂停、音量、全屏、进度条

### 📺 连续剧管理

支持多季多集的连续剧目录结构，智能识别季/集编号，提供分季浏览和一键播放。

### 🔍 搜索与筛选

- **分类筛选** — 按剧情、动作、科幻等分类浏览
- **评分排序** — 按评分从高到低/从低到高排序
- **智能搜索** — 支持中文、英文及拼音首字母搜索
  - 首页搜索：同时搜索电影和连续剧
  - 电影库搜索：仅搜索电影
  - 连续剧搜索：仅搜索连续剧

**拼音搜索示例**：
| 搜索词 | 匹配内容 |
|--------|----------|
| `wjjh` | 挽救计划 |
| `lrcq` | 利刃出鞘 |
| `zhd` | 最后的舞动 |

### 📊 观看历史

自动记录观看进度，首页展示最近观看的影片，支持断点续播。

---

## 快速开始

### 前置条件

- Node.js >= 18
- npm >= 9

### 安装与启动

#### 🚀 Windows 用户（推荐）

直接双击运行 `start.bat`，脚本会自动完成：

1. **端口检测** — 自动检测并释放端口 3000
2. **依赖安装** — 自动安装后端和前端依赖
3. **生产构建** — 编译 TypeScript 代码
4. **服务启动** — 启动前后端服务

启动成功后，命令行窗口会显示访问地址，包括局域网 IP 地址，方便其他设备访问。

#### 📦 手动安装

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
- **前端页面**: http://localhost:5173（开发模式）

> **生产模式**: 通过 `start.bat` 启动时，前端由 Express 在端口 3000 统一托管，只需访问 http://localhost:3000

### 首次使用

1. **启动服务**
   - **生产模式**（推荐）：双击运行 `start.bat`，访问 http://localhost:3000
   - **开发模式**：运行 `npm run dev`，访问 http://localhost:5173
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
│   │   │   ├── home/                # 首页组件
│   │   │   ├── layout/              # 布局组件
│   │   │   ├── movie/               # 影片展示
│   │   │   └── settings/            # 设置组件
│   │   ├── pages/                   # 页面组件
│   │   ├── utils/                   # 工具函数
│   │   ├── App.tsx                  # 根组件（路由）
│   │   └── main.tsx                 # 入口文件
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # 后端 (Express + SQLite)
│   ├── routes/                      # API 路由
│   │   ├── home.ts                  # 首页聚合 API
│   │   ├── movies.ts                # 电影 API
│   │   ├── series.ts                # 剧集 API
│   │   ├── sources.ts               # 电影源管理 API
│   │   ├── library.ts               # 媒体库刷新 API
│   │   ├── stream.ts                # 视频流 API
│   │   ├── posters.ts               # 海报服务 API
│   │   └── genres.ts                # 分类 API
│   ├── services/                    # 业务服务
│   ├── db.ts                        # 数据库初始化
│   ├── config.ts                    # 环境配置
│   └── index.ts                     # 服务入口
│
├── shared/                          # 前后端共享代码
│   └── types.ts                     # TypeScript 类型定义
│
├── docs/                            # 技术文档
│   ├── 01-项目概述与技术架构.md
│   ├── 02-数据库设计.md
│   ├── 03-API接口设计.md
│   └── 04-前端架构设计.md
│
├── data/                            # 运行时数据
│   ├── images/                      # 海报图片缓存
│   └── movies.db                    # SQLite 数据库
│
├── .env.sample                      # 环境变量模板
├── start.bat                        # Windows 一键启动脚本
├── package.json                     # 后端依赖与脚本
└── README.md
```

---

## API 概览

### 首页 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/home` | GET | 首页综合数据（Hero、最近观看、最新添加、媒体库） |
| `/api/home/hero` | GET | 获取首页轮播数据 |
| `/api/home/recently-watched` | GET | 最近观看记录 |
| `/api/home/latest` | GET | 最新添加的电影 |
| `/api/home/watch-history` | POST | 记录观看历史 |

### 电影 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/movies` | GET | 电影列表（支持分页、分类、排序、搜索） |
| `/api/movies/cards` | GET | 电影卡片列表（简化数据） |
| `/api/movies/:id` | GET | 电影详情 |
| `/api/movies/:id/fetch-metadata` | POST | 手动刷新元数据 |
| `/api/movies/retry-missing-posters` | POST | 重试获取缺失海报 |

### 剧集 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/series` | GET | 剧集列表 |
| `/api/series/cards` | GET | 剧集卡片列表 |
| `/api/series/:id` | GET | 剧集详情（含分季分集） |
| `/api/series/:id/fetch-metadata` | POST | 刷新剧集元数据 |
| `/api/series/episodes/:id` | PATCH | 更新集播放状态 |

### 媒体源 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sources` | GET | 电影源列表 |
| `/api/sources` | POST | 添加电影源 |
| `/api/sources/:id` | GET | 获取源详情 |
| `/api/sources/:id` | PUT | 更新电影源配置 |
| `/api/sources/:id` | DELETE | 删除电影源 |
| `/api/sources/:id/test` | POST | 测试源连接 |
| `/api/sources/test-config` | POST | 测试源配置（不保存） |
| `/api/sources/clear-library` | POST | 清空媒体库 |

### 媒体库 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/library/refresh` | POST | 触发全库刷新扫描 |
| `/api/library/refresh/status` | GET | 刷新进度查询 |
| `/api/library/posters/download` | POST | 批量下载缺失海报 |

### 视频流 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/stream/movie/:id/direct` | GET | 电影视频流（支持 Range） |
| `/api/stream/episode/:id/direct` | GET | 剧集视频流（支持 Range） |

### 其他 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/genres` | GET | 获取所有分类 |
| `/api/genres/stats` | GET | 分类统计 |
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

### 运行说明

**Windows 用户**: 推荐直接使用 `start.bat` 一键启动，脚本会自动处理端口占用问题并显示局域网访问地址。

**局域网访问**: 启动后服务会自动检测本机局域网 IP 地址，并在命令行窗口显示，其他设备可通过该 IP 访问服务。

**端口占用**: `start.bat` 会自动检测并释放端口 3000，如果端口被占用会自动终止占用进程。

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
| [pinyin-pro](https://pinyin-pro.cn/) | 拼音转换 |
| [nodemon](https://nodemon.io/) | 开发热重载 |

### 元数据来源

- [TMDB](https://www.themoviedb.org/) — 国际电影数据库（海报、简介、演员）
- [OMDb API](http://www.omdbapi.com/) — IMDb 评分
- [豆瓣](https://movie.douban.com/) — 中文评分与简介

---

## 技术文档

详细的技术设计文档位于 `docs/` 目录：

| 文档 | 说明 |
|------|------|
| [01-项目概述与技术架构.md](docs/01-项目概述与技术架构.md) | 项目简介、技术栈、目录结构、构建命令 |
| [02-数据库设计.md](docs/02-数据库设计.md) | 数据库表结构、索引、关联关系 |
| [03-API接口设计.md](docs/03-API接口设计.md) | RESTful API 端点详细说明 |
| [04-前端架构设计.md](docs/04-前端架构设计.md) | 组件架构、路由配置、状态管理 |

---

## 常见问题与解决方案

### 🚀 快速启动

**推荐方式**: Windows 用户直接双击运行 `start.bat`，脚本会自动完成：
1. 检查 Node.js 版本（要求 >= 18.x）
2. 自动检测并释放端口 3000
3. 安装依赖（如未安装）
4. 构建项目
5. 启动服务

---

### ❌ Node.js 相关错误

#### 1. Node.js 未安装或不在 PATH 中

**错误信息**:
```
[Error] Node.js is not installed or not in PATH!
```

**解决方案**:
- 从 [Node.js 官网](https://nodejs.org/) 下载并安装 Node.js >= 18.x
- 安装时确保勾选 "Add to PATH" 选项
- 安装完成后重启命令提示符

---

#### 2. Node.js 版本过低

**错误信息**:
```
[Error] Node.js version is too low!
Current: v16.13.0, Required: >= v18.0.0
```

**解决方案**:
- 卸载旧版本 Node.js
- 安装 Node.js 18.x 或更高版本
- 推荐使用 LTS 版本

---

#### 3. npm 命令找不到

**错误信息**:
```
[Error] npm is not installed!
```

**解决方案**:
- npm 通常随 Node.js 一起安装
- 重新安装 Node.js，确保安装过程没有报错
- 检查环境变量 PATH 中是否包含 npm 路径

---

### ❌ 依赖安装错误

#### 1. 网络连接问题

**错误信息**:
```
npm ERR! network timeout at: ...
```

**解决方案**:
- 检查网络连接是否正常
- 尝试切换网络（如从 Wi-Fi 切换到有线）
- 配置 npm 代理（如需要）：
  ```bash
  npm config set proxy http://proxy:port
  npm config set https-proxy http://proxy:port
  ```

---

#### 2. npm 缓存问题

**错误信息**:
```
npm ERR! ENOENT: no such file or directory, open '...'
```

**解决方案**:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

#### 3. 权限问题

**错误信息**:
```
npm ERR! EACCES: permission denied, mkdir '...'
```

**解决方案**:
- 在 Windows 上，以 **管理员身份** 运行命令提示符
- 在 Linux/macOS 上，使用 `sudo npm install`

---

### ❌ 构建错误

#### 1. TypeScript 编译错误

**错误信息**:
```
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**解决方案**:
- 检查错误信息中指出的文件和行号
- 根据错误提示修复 TypeScript 类型问题
- 确保所有依赖都已正确安装

---

#### 2. 前端构建内存不足

**错误信息**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**解决方案**:
```bash
# Windows
set NODE_OPTIONS=--max_old_space_size=4096
npm run build:client

# Linux/macOS
export NODE_OPTIONS=--max_old_space_size=4096
npm run build:client
```

---

### ❌ 端口占用错误

#### 1. 端口 3000 被占用

**错误信息**:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**解决方案**:
- `start.bat` 会自动检测并尝试终止占用端口的进程
- 如果自动终止失败，手动查找并终止进程：
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /F /PID <PID>
  
  # Linux/macOS
  lsof -ti:3000 | xargs kill -9
  ```
- 或者修改 `.env` 文件中的 `PORT` 配置

---

### ❌ 运行时错误

#### 1. 数据库文件不存在

**错误信息**:
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**解决方案**:
- 确保 `data/` 目录存在且有写入权限
- 检查 `DB_PATH` 配置是否正确
- 手动创建 `data/` 目录：
  ```bash
  mkdir data
  ```

---

#### 2. 元数据获取失败

**错误信息**:
```
Error: Cannot fetch metadata, no API key configured
```

**解决方案**:
- 复制 `.env.sample` 为 `.env`
- 至少配置一个元数据来源的 API Key：
  - OMDb API Key：[OMDb](http://www.omdbapi.com/)
  - TMDB API Key：[TMDB](https://www.themoviedb.org/)
  - 豆瓣 API Key（可选）

---

### ❌ 播放错误

#### 1. 视频无法播放

**可能原因**:
- 视频格式不被浏览器支持
- 文件路径包含特殊字符或中文
- 文件不存在或已损坏

**解决方案**:
- 确保视频文件格式为 MP4、WebM、MOV、AVI 或 MKV
- 将文件路径改为纯英文
- 检查文件是否存在且可正常读取

---

### ❓ 其他问题

如果遇到其他问题，请检查以下步骤：

1. **检查日志**: 启动脚本会输出详细日志，请查看错误信息
2. **查看端口**: 确保端口 3000 没有被其他程序占用
3. **重新安装**: 删除 `node_modules` 和 `package-lock.json` 后重新安装
4. **检查环境**: 确保 Node.js >= 18.x 和 npm >= 9
5. **查看文档**: 参考 `docs/` 目录下的技术文档

---

## 许可证

本项目仅供个人学习和非商业用途。