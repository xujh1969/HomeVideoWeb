/**
 * fetchCnMovieMeta.mjs — 中文电影元数据查询（豆瓣 Playwright + OMDb 联合）
 *
 * 功能:
 *   1. 豆瓣 JSON 接口搜索 → 获取 subject ID
 *   2. Playwright 真实浏览器打开详情页 → 提取评分/简介/导演/演员/海报
 *   3. 同时调用 OMDb API → 获取 IMDB 评分
 *   4. 合并输出统一结构
 *
 * 用法:
 *     node fetchCnMovieMeta.mjs "霸王别姬"
 *     node fetchCnMovieMeta.mjs "霸王别姬" "Farewell My Concubine"
 *
 * 依赖: playwright, axios
 * 安装: npm install playwright axios && npx playwright install chromium
 */

import axios from 'axios'
import { chromium } from 'playwright'

const OMDB_API_KEY = '71a777d6'
const OMDB_BASE   = 'http://www.omdbapi.com/'

// ====================== 豆瓣：先用 JSON 接口搜索 ======================

const DOUBAN_API_SEARCH = 'https://movie.douban.com/j/new_search_subjects'

/**
 * 用 Playwright 调用豆瓣 JSON 搜索接口（绕过 CORS + 反爬）
 * 返回 { id, title, year } 或 null
 */
async function searchDoubanApi(page, titleCN) {
  const url = `${DOUBAN_API_SEARCH}?sort=S&range=0,10&tags=&cat=1002&search_text=${encodeURIComponent(titleCN)}`
  console.log(`     → JSON搜索: ${url}`)

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

  const result = await page.evaluate(() => {
    try {
      const data = JSON.parse(document.body.textContent)
      if (data?.data?.length > 0) {
        return { id: data.data[0].id, title: data.data[0].title, year: data.data[0].year }
      }
    } catch {}
    return null
  })

  return result  // { id, title, year } | null
}

// ====================== 豆瓣：Playwright 爬详情页 ======================

/**
 * 用 Playwright 打开豆瓣详情页，提取所有元数据
 */
async function fetchDoubanDetail(titleCN) {
  console.log(`  🎭 豆瓣 Playwright: "${titleCN}"`)

  // 使用系统已安装的 Edge（国内网络 Chromium 下载超时）
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',    // Windows 系统自带 Edge，无需下载
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      locale: 'zh-CN',
      viewport: { width: 1280, height: 800 }
    })
    const page = await context.newPage()

    // ── 第1步：JSON 接口搜索 subject ID ──
    const searchResult = await searchDoubanApi(page, titleCN)

    if (!searchResult) {
      console.log(`     → JSON接口未找到，尝试 HTML 搜索页...`)
      // 降级：打开 HTML 搜索页
      const htmlUrl = `https://www.douban.com/search?q=${encodeURIComponent(titleCN)}&cat=1002`
      await page.goto(htmlUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2000)

      const found = await page.evaluate(() => {
        const links = [...document.querySelectorAll('a[href*="/subject/"]')]
        if (links.length > 0) {
          const m = links[0].href.match(/\/subject\/(\d+)/)
          return m ? { id: m[1], title: links[0].textContent.trim() } : null
        }
        return null
      })

      if (!found) {
        console.log(`     → 未找到该影片`)
        return null
      }
      searchResult = found
    }

    const { id: subjectId, title } = searchResult
    console.log(`     → 找到: "${title || titleCN}" (ID: ${subjectId})`)

    // ── 第2步：打开详情页 ──
    const detailUrl = `https://movie.douban.com/subject/${subjectId}/`
    console.log(`     → 打开详情页...`)
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    // ── 第3步：提取详情 ──
    const data = await page.evaluate((sid) => {
      const el = (sel) => document.querySelector(sel)?.textContent.trim() || ''

      // 评分
      const ratingEl = document.querySelector('.rating_num, .ll.rating_num')
      const rating = ratingEl ? parseFloat(ratingEl.textContent) : 0

      // 评分人数
      const votesText = el('.rating_people span, .rating_sum span')
      const votes = parseInt((votesText.match(/[\d,]+/) || ['0'])[0].replace(/,/g, '')) || 0

      // 简介
      let summary = ''
      const sumEl = document.querySelector('span[property="v:summary"], .related-info .indent')
      if (sumEl) {
        summary = sumEl.textContent.trim()
        // 尝试展开「展开全部」
        const fullEl = document.querySelector('#link-report-intra span.full')
        if (fullEl) summary = fullEl.textContent.trim()
      }

      // 导演
      const directors = [...document.querySelectorAll('a[rel="v:directedBy"]')].map(a => a.textContent.trim())

      // 主演（前8个）
      const actors = [...document.querySelectorAll('a[rel="v:starring"]')].slice(0, 8).map(a => a.textContent.trim())

      // 类型
      const genres = [...document.querySelectorAll('span[property="v:genre"]')].map(a => a.textContent.trim())

      // 年份
      const yearText = el('.year')
      const year = parseInt((yearText.match(/\d{4}/) || ['0'])[0])

      // 片长
      const duration = el('span[property="v:runtime"]')

      // 海报
      const posterEl = document.querySelector('.subject-wrap img, #mainpic img')
      const poster = posterEl ? posterEl.src : ''

      return {
        subjectId: sid,
        title:    document.querySelector('h1 span[property="v:itemreviewed"]')?.textContent.trim() || '',
        rating,
        votes,
        summary:   summary.slice(0, 500),
        directors,
        actors,
        genres,
        year,
        duration,
        poster:   poster || '',
      }
    }, subjectId)

    console.log(`     → 豆瓣评分: ${data.rating || '无'}/10 (${data.votes}人)`)
    return data

  } finally {
    await browser.close()
  }
}

// ====================== OMDb API ======================

async function fetchOMDb(titleEN) {
  if (!titleEN) return null
  try {
    console.log(`  🌐 OMDb: "${titleEN}"`)
    const url = new URL(OMDB_BASE)
    url.searchParams.set('apikey', OMDB_API_KEY)
    url.searchParams.set('t', titleEN)
    url.searchParams.set('type', 'movie')

    const { data } = await axios.get(url.toString(), { timeout: 10000 })
    if (data.Response === 'False') return null

    console.log(`     → IMDB ${data.imdbRating}/10 (${data.imdbVotes}票)`)
    return {
      imdbRating:  data.imdbRating,
      imdbVotes:   data.imdbVotes,
      imdbID:      data.imdbID,
      plot:        data.Plot !== 'N/A' ? data.Plot : '',
      posterOmdb:  data.Poster !== 'N/A' ? data.Poster : '',
      metascore:   data.Metascore !== 'N/A' ? data.Metascore : '',
    }
  } catch {
    return null
  }
}

// ====================== 合并 + 输出 ======================

async function fetchCnMovieMeta(titleCN, titleEN) {
  console.log(`\n${'═'.repeat(52)}`)
  console.log(`🎬 "${titleCN}"${titleEN ? ` (${titleEN})` : ''}`)
  console.log(`${'═'.repeat(52)}`)

  // 并行：豆瓣 Playwright + OMDb
  const [douban, omdb] = await Promise.all([
    fetchDoubanDetail(titleCN).catch(err => {
      console.log(`     ⚠️  豆瓣爬取失败: ${err.message}`)
      return null
    }),
    fetchOMDb(titleEN || titleCN).catch(() => null)
  ])

  if (!douban && !omdb) {
    console.log(`\n❌ 所有数据源均失败`)
    return null
  }

  // 合并
  const meta = {
    titleCN:    douban?.title    || titleCN,
    doubanId:   douban?.subjectId || null,
    doubanRating: douban?.rating     || null,
    doubanVotes: douban?.votes      || 0,
    summary:     douban?.summary    || (omdb?.plot || ''),
    directors:   douban?.directors  || [],
    actors:      douban?.actors     || [],
    genres:      douban?.genres    || [],
    year:        douban?.year       || 0,
    duration:    douban?.duration   || '',
    posterUrl:   douban?.poster    || (omdb?.posterOmdb || ''),

    titleEN:     omdb ? titleEN : '',
    imdbRating:  omdb?.imdbRating  || null,
    imdbVotes:   omdb?.imdbVotes   || null,
    imdbID:      omdb?.imdbID      || null,
    metascore:   omdb?.metascore   || null,

    source: [douban ? 'douban' : '', omdb ? 'omdb' : ''].filter(Boolean).join('+')
  }

  // 打印
  console.log(`\n${'═'.repeat(52)}`)
  console.log(`📋 结果`)
  console.log(`${'═'.repeat(52)}`)
  console.log(`  中文片名:  ${meta.titleCN}`)
  if (meta.titleEN) console.log(`  英文片名:  ${meta.titleEN}`)
  console.log(`  年份:      ${meta.year || 'N/A'}`)
  console.log(`  时长:      ${meta.duration || 'N/A'}`)
  console.log(`  导演:      ${meta.directors.join(', ') || 'N/A'}`)
  console.log(`  主演:      ${meta.actors.slice(0, 5).join(', ') || 'N/A'}`)
  console.log(`  类型:      ${meta.genres.join(' / ') || 'N/A'}`)
  console.log(`${'─'.repeat(52)}`)
  console.log(`  豆瓣评分:  ${meta.doubanRating || 'N/A'}/10 (${meta.doubanVotes}人)`)
  console.log(`  IMDB评分:  ${meta.imdbRating || 'N/A'}/10 (${meta.imdbVotes})`)
  if (meta.metascore) console.log(`  Meta:      ${meta.metascore}`)
  console.log(`${'─'.repeat(52)}`)
  console.log(`  海报:      ${meta.posterUrl || '无'}`)
  console.log(`  简介:      ${(meta.summary || '').replace(/\s+/g, ' ').slice(0, 150)}...`)
  console.log(`  来源:      ${meta.source}`)
  console.log(`${'═'.repeat(52)}\n`)

  console.log('// JSON:')
  console.log(JSON.stringify(meta, null, 2))

  return meta
}

// ====================== 入口 ======================

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('用法: node fetchCnMovieMeta.mjs "中文片名" [英文片名]')
    console.log('例:  node fetchCnMovieMeta.mjs "霸王别姬" "Farewell My Concubine"')
    process.exit(1)
  }

  const results = []
  // 简单配对：奇数位=中文，下一个=英文（如果有）
  for (let i = 0; i < args.length; i++) {
    const titleCN = args[i]
    let titleEN = ''
    if (i + 1 < args.length && /[a-zA-Z]/.test(args[i + 1]) && !args[i + 1].startsWith('"')) {
      titleEN = args[i + 1]
      i++
    }
    const meta = await fetchCnMovieMeta(titleCN, titleEN)
    if (meta) results.push(meta)
  }

  if (results.length > 1) {
    console.log(`\n📊 共查询 ${results.length} 部电影`)
  }
}

main().catch(err => {
  console.error('❌ 致命错误:', err.message)
  process.exit(1)
})
