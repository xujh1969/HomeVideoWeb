/**
 * doubanFetcher.mjs — 豆瓣 + OMDb 联合电影元数据查询
 *
 * 核心策略（极简 HTTP，无需浏览器！）:
 *   1. POST 豆瓣 API v2 → 搜索 + 详情（apikey 放 body，不能用 GET）
 *   2. OMDb API → IMDB 评分（英文片名优先，中文兜底）
 *   3. 合并输出统一结构
 *
 * API Keys（社区维护，POST body 传参才能用）:
 *   豆瓣: 0ab215a8b1977939201640fa14c66bab (通用)
 *        0df993c66c0c636e29ecbb5344252a4a (备用)
 *   OMDb: 71a777d6 (已激活, 1000次/天)
 *
 * 用法:
 *   node doubanFetcher.mjs "霸王别姬"
 *   node doubanFetcher.mjs "流浪地球2" "我不是药神"
 */

import axios from 'axios'

// ─── 配置 ───
const DOUBAN_KEY = '0ab215a8b1977939201640fa14c66bab'
const DOUBAN_KEY2 = '0df993c66c0c636e29ecbb5344252a4a'
const OMDB_KEY = '71a777d6'

// ─── Douban API（必须用 POST，apikey 放 body）───

/** 搜索电影 */
async function doubanSearch(title, apikey = DOUBAN_KEY) {
  const { data } = await axios.post('https://api.douban.com/v2/movie/search', {
    q: title,
    count: 3,
    apikey
  }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } })

  if (!data?.subjects?.length) return null
  return data.subjects[0]  // 返回最匹配的结果
}

/** 获取详情（评分、简介、导演、演员等） */
async function doubanDetail(subjectId, apikey = DOUBAN_KEY) {
  const { data } = await axios.post(`https://api.douban.com/v2/movie/subject/${subjectId}`, {
    apikey
  }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } })

  return data
}

// ─── OMDb API ───

/**
 * 从豆瓣 aka 数组中提取英文片名
 */
function extractEnglishTitle(aka = [], originalTitle = '') {
  // 优先 original_title（如果是英文）
  if (originalTitle && /^[\x00-\x7F\s]+$/.test(originalTitle) && /[a-zA-Z]/.test(originalTitle)) {
    return originalTitle
  }
  // 从 aka 中找纯英文/数字的
  for (const alias of aka) {
    // 允许: ASCII字符 + 空格 + Unicode罗马数字(ⅠⅡⅢⅣⅤⅥ) + 常见符号
    if (/^[\x00-\x7F\sⅠⅡⅢⅣⅤⅥ\-'&!.,():]+$/.test(alias) && /[a-zA-Z]{3,}/.test(alias)) {
      // 保留罗马数字不删除，OMDb 可能收录 ASCII 或 Unicode 版本
      return alias.trim()
    }
  }
  return null
}

/** 获取 IMDB 评分（需要英文片名 + 年份验证） */
async function omdbSearch(titleEN, doubanYear = null) {
  if (!titleEN) return null

  // Unicode 罗马数字 → ASCII 映射
  const romanMap = { 'Ⅰ':'I','Ⅱ':'II','Ⅲ':'III','Ⅳ':'IV','Ⅴ':'V','Ⅵ':'VI' }
  const asciiTitle = titleEN.replace(/[ⅠⅡⅢⅣⅤⅥ]/g, c => romanMap[c] || c)

  // 先试原标题，失败再试 ASCII 罗马数字版
  const titles = [titleEN]
  if (asciiTitle !== titleEN) titles.push(asciiTitle)

  for (const title of titles) {
    try {
      const { data } = await axios.get('http://www.omdbapi.com/', {
        params: { apikey: OMDB_KEY, t: title, type: 'movie' },
        timeout: 8000
      })
      if (data.Response === 'False') continue

      const omdbYear = parseInt(data.Year)
      const dbYear = doubanYear ? parseInt(doubanYear) : null
      if (dbYear && omdbYear && Math.abs(omdbYear - dbYear) > 1) {
        continue  // 年份不匹配
      }

      return {
        imdbId: data.imdbID,
        imdbRating: parseFloat(data.imdbRating) || null,
        imdbVotes: data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
        titleEN: data.Title,
      }
    } catch { continue }
  }
  return null
}

// ─── 主函数 ───

async function fetchMovieMeta(titleCN, titleEN = '') {
  console.log(`\n🔍 "${titleCN}"${titleEN ? ` (${titleEN})` : ''}`)

  // Step 1: 豆瓣搜索（POST）
  console.log(`  [1/3] 豆瓣搜索...`)
  let searchResult
  try {
    searchResult = await doubanSearch(titleCN)
  } catch (e) {
    // 尝试备用 Key
    console.log(`    主Key失败 (${e.response?.status}), 尝试备用Key...`)
    try {
      searchResult = await doubanSearch(titleCN, DOUBAN_KEY2)
    } catch {
      console.log(`    → 豆瓣搜索全部失败`)
      searchResult = null
    }
  }

  if (!searchResult) {
    console.log(`    → 未找到`)
    return { error: '豆瓣未找到该影片', query: { titleCN, titleEN } }
  }

  const doubanId = searchResult.id
  console.log(`    → "${doubanId === searchResult.id ? searchResult.title : searchResult.id}" 评分 ${searchResult.rating?.average || '?'}`)

  // Step 2: 豆瓣详情（先拿到英文名和年份）
  console.log(`  [2/3] 获取豆瓣详情...`)
  const detail = await doubanDetail(doubanId).catch(() => null)

  if (detail) {
    console.log(`    → 豆瓣: ${detail.rating?.average}/10 (${detail.ratings_count}票)`)
    console.log(`    → 简介: ${(detail.summary || '').substring(0, 80)}...`)
    console.log(`    → 导演: ${detail.directors?.map(d => d.name).join(', ') || '-'}`)
    console.log(`    → 演员: ${detail.casts?.slice(0,5).map(c => c.name).join(', ') || '-'}`)
  }

  // Step 3: OMDb（用从豆瓣提取的英文名 + 年份校验）
  console.log(`  [3/3] 获取IMDB评分...`)
  const engTitle = extractEnglishTitle(detail?.aka || [], detail?.original_title || '')
  const omdb = engTitle
    ? await omdbSearch(engTitle, detail?.year).catch(() => null)
    : null

  if (omdb) {
    console.log(`    → IMDB: ${omdb.imdbRating}/10 (${omdb.imdbVotes}票) via "${engTitle}"`)
  } else {
    console.log(`    → ${engTitle ? `OMDb未收录 "${engTitle}"` : '无英文片名，跳过OMDb'}`)
  }

  const result = {
    query: { titleCN, titleEN },
    doubanId,
    // 豆瓣为主（中文最完整）
    titleCN: detail?.title || searchResult.title,
    titleEN: detail?.original_title || omdb?.titleEN || searchResult.original_title,
    rating_douban: detail?.rating?.average || searchResult.rating?.average || null,
    votes_douban: detail?.ratings_count || null,
    summary: detail?.summary || null,
    directors: detail?.directors?.map(d => d.name) || [],
    actors: detail?.casts?.map(c => c.name).slice(0, 8) || [],
    genres: detail?.genres || [],
    year: detail?.year || null,
    duration: detail?.durations?.[0] || null,
    countries: detail?.countries || [],
    poster: detail?.images?.large || searchResult.images?.large || null,
    aka: detail?.aka || [],
    // IMDB（仅评分，不混入其他字段防止误配）
    imdbId: omdb?.imdbId || null,
    rating_imdb: omdb?.imdbRating || null,
    votes_imdb: omdb?.imdbVotes || null,
    // 元数据
    sources: {
      douban: !!detail,
      omdb: !!omdb
    }
  }

  return result
}

// ─── CLI ───
const isMain = process.argv[1]?.endsWith('doubanFetcher.mjs')
if (isMain) {
  const titles = process.argv.slice(2)
  if (titles.length === 0) {
    console.log('用法: node doubanFetcher.mjs "片名1" ["片名2" ...]')
    process.exit(1)
  }
  for (const title of titles) {
    const result = await fetchMovieMeta(title)
    console.log('\n' + '='.repeat(60))
    console.log(JSON.stringify(result, null, 2))
  }
}
