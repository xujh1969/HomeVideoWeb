/**
 * fetchMovieMeta.mjs — OMDb + 搜索引擎 联合元数据查询
 *
 * 用法: node fetchMovieMeta.mjs "肖申克的救赎"
 *       node fetchMovieMeta.mjs "Inception"
 *
 * 数据源优先级:
 *   1. OMDb API        → IMDB评分 + 英文元数据 + 海报 (✅ 可靠)
 *   2. 搜索引擎间接查询 → 豆瓣 subject ID + 评分 ⚠️ 非结构化
 *
 * 注: 豆瓣已全面启用风控(sec.douban.com)，API Key 被封禁，
 *     直接用 HTTP 请求被拦截，需 Playwright 模拟浏览器或用户手动提供 ID。
 */

const OMDB_API_KEY = '71a777d6'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// ====================== 搜索引擎间接查豆瓣 ID ======================

/**
 * 通过 Bing 搜索获取豆瓣 subject ID 和评分
 * 用搜索引擎绕开豆瓣的直接风控
 */
async function searchDoubanViaEngine(query) {
  console.log(`  🔍 搜索引擎: "site:movie.douban.com/subject ${query}"`)

  const searchUrl = new URL('https://www.bing.com/search')
  searchUrl.searchParams.set('q', `site:movie.douban.com/subject ${query}`)

  try {
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12000),
    })
    const html = await res.text()

    // 提取豆瓣 subject ID
    const idMatch = html.match(/movie\.douban\.com\/subject\/(\d+)/)
    const doubanId = idMatch ? idMatch[1] : null

    if (!doubanId) {
      console.log(`     → 未找到`)
      return null
    }

    // 评分无法从搜索摘要可靠提取，标记为"需 Playwright 补充"
    console.log(`     → 豆瓣ID: ${doubanId} (评分需 Playwright 获取)`)
    return { doubanId }
  } catch (err) {
    console.log(`     → 搜索引擎查询失败: ${err.message}`)
    return null
  }
}

// ====================== OMDb API ======================

/**
 * OMDb 查询电影元数据
 * @param {string} title - 片名（英文最佳）
 * @param {number} [year] - 年份（辅助匹配）
 */
async function fetchOMDb(title, year) {
  console.log(`  🎬 OMDb: "${title}"${year ? ` (${year})` : ''}`)

  const url = new URL('http://www.omdbapi.com/')
  url.searchParams.set('apikey', OMDB_API_KEY)
  url.searchParams.set('t', title)
  url.searchParams.set('type', 'movie')
  if (year) url.searchParams.set('y', String(year))

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const data = await res.json()

  if (data.Response === 'False') {
    console.log(`     → ${data.Error}`)
    return null
  }

  console.log(`     → IMDB ${data.imdbRating}/10 | ${data.imdbVotes} votes | ${data.imdbID}`)
  return data
}

// ====================== 核心合并函数 ======================

/**
 * 查询电影元数据
 *
 * @param {string} query - 片名（中/英文均可，英文优先匹配 OMDb）
 * @param {Object}  [opts]
 * @param {string}  [opts.titleEN]   - 英文片名（已知时传入，加速 OMDb 匹配）
 * @param {number}  [opts.year]      - 年份（提高匹配精度）
 * @param {string}  [opts.doubanId]  - 豆瓣 subject ID（已知时传入，跳过搜索）
 * @returns {Promise<Object|null>}
 */
async function fetchMovieMeta(query, opts = {}) {
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`🎯 "${query}"${opts.titleEN ? ` (EN: ${opts.titleEN})` : ''}`)
  console.log(`${'═'.repeat(50)}`)

  // ── 并行：OMDb + 豆瓣搜索引擎查询 ──
  const [omdbResult, doubanFromEngine] = await Promise.all([
    fetchOMDb(opts.titleEN || query, opts.year).catch(() => null),
    opts.doubanId
      ? Promise.resolve({ doubanId: opts.doubanId })
      : searchDoubanViaEngine(query).catch(() => null),
  ])

  // ── 合并 ──
  if (!omdbResult && !doubanFromEngine) {
    console.log(`\n❌ 所有数据源均失败`)
    return null
  }

  const data = omdbResult

  const meta = {
    // 基本信息
    titleCN: query,
    titleEN: data?.Title || opts.titleEN || query,
    year: data?.Year ? parseInt(data.Year) : (opts.year || 0),
    summary: data?.Plot !== 'N/A' ? data.Plot : null,
    duration: data?.Runtime !== 'N/A' ? data.Runtime : null,

    // 演职员
    directors: data?.Director !== 'N/A' ? data.Director.split(', ') : [],
    actors: data?.Actors !== 'N/A' ? data.Actors.split(', ') : [],

    // 分类
    genres: data?.Genre !== 'N/A' ? data.Genre.split(', ') : [],

    // 评分
    imdbRating: data?.imdbRating || null,
    imdbVotes: data?.imdbVotes || null,
    imdbID: data?.imdbID || null,
    metascore: data?.Metascore !== 'N/A' ? data.Metascore : null,

    // 豆瓣（仅 ID，评分需 Playwright 获取）
    doubanId: opts.doubanId || doubanFromEngine?.doubanId || null,
    doubanRating: null,  // 需要 Playwright 模拟浏览器获取

    // 海报
    posterUrl: data?.Poster !== 'N/A' ? data.Poster : null,

    // 票房
    boxOffice: data?.BoxOffice !== 'N/A' ? data.BoxOffice : null,
    rated: data?.Rated !== 'N/A' ? data.Rated : null,

    // 来源标识
    source: [
      data ? 'omdb' : '',
      doubanFromEngine?.doubanId ? 'douban(id-only)' : '',
    ].filter(Boolean).join('+'),
  }

  return meta
}

// ====================== 输出 ======================

function printResult(meta) {
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`📦 结果`)
  console.log(`${'═'.repeat(50)}`)
  console.log(`  片名:     ${meta.titleCN}`)
  console.log(`  AKA:      ${meta.titleEN}`)
  console.log(`  年份:     ${meta.year || 'N/A'}`)
  console.log(`  时长:     ${meta.duration || 'N/A'}`)
  console.log(`  分级:     ${meta.rated || 'N/A'}`)
  console.log(`  导演:     ${meta.directors?.join(', ') || 'N/A'}`)
  console.log(`  主演:     ${meta.actors?.slice(0, 5).join(', ') || 'N/A'}`)
  console.log(`  类型:     ${meta.genres?.join(' / ') || 'N/A'}`)
  console.log(`${'─'.repeat(50)}`)
  console.log(`  豆瓣评分:  ${meta.doubanRating || 'N/A'} (ID: ${meta.doubanId || 'N/A'})`)
  console.log(`  IMDB评分:  ${meta.imdbRating || 'N/A'}/10 (${(meta.imdbVotes || 'N/A')})`)
  console.log(`  Meta:      ${meta.metascore || 'N/A'}`)
  console.log(`${'─'.repeat(50)}`)
  console.log(`  票房:     ${meta.boxOffice || 'N/A'}`)
  console.log(`  海报:     ${meta.posterUrl || '无'}`)
  console.log(`  简介:     ${(meta.summary || '').slice(0, 150)}...`)
  console.log(`  来源:     ${meta.source}`)
  console.log(`${'═'.repeat(50)}\n`)
}

// ====================== 入口 ======================

async function main() {
  const args = process.argv.slice(2)
  const titles = args.length > 0 ? args : ['The Shawshank Redemption']

  const results = []
  for (const title of titles) {
    try {
      const meta = await fetchMovieMeta(title)
      if (meta) {
        printResult(meta)
        results.push(meta)
      }
    } catch (err) {
      console.log(`\n❌ "${title}" 失败: ${err.message}`)
    }
  }

  if (results.length > 0) {
    console.log('// JSON:')
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2))
  }

  // 统计
  console.log(`\n📊 数据源统计:`)
  for (const r of results) {
    console.log(`  "${r.titleCN}" → ${r.source}`)
  }
}

main()
