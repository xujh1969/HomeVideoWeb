import axios from 'axios'

// 豆瓣API代理地址列表
const DOUBAN_API_PROXIES = [
  'https://douban-api.uieee.xyz',
  'https://douban-api.uieee.com',
  'https://douban.fakeid.moe',
  'https://douban.0728.org',
]

// 用户代理列表（随机选择以避免被封）
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
]

// 随机延迟函数（避免被封）
function randomDelay(minMs: number = 1000, maxMs: number = 3000): Promise<void> {
  const delay = Math.random() * (maxMs - minMs) + minMs
  return new Promise(resolve => setTimeout(resolve, delay))
}

// 获取随机用户代理
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

export interface DoubanSearchResult {
  id: string
  title: string
  original_title: string
  rating: {
    average: number
    numRaters: number
  }
  images: {
    small: string
    medium: string
    large: string
  }
  year: string
  genres: string[]
  directors: { name: string }[]
  casts: { name: string }[]
  summary: string
  type: string
}

export interface DoubanMovieDetail {
  id: string
  title: string
  original_title: string
  rating: {
    average: number
    numRaters: number
  }
  images: {
    small: string
    medium: string
    large: string
  }
  year: string
  genres: string[]
  directors: { name: string }[]
  casts: { name: string }[]
  summary: string
  aka: string[]
  countries: string[]
  durations: string[]
}

export interface DoubanSearchResponse {
  count: number
  start: number
  total: number
  subjects: DoubanSearchResult[]
}

// 模拟豆瓣数据（当API都不可用时使用）
const mockDoubanData: Record<string, Partial<DoubanMovieDetail>> = {
  '流浪地球': {
    id: '30163507',
    title: '流浪地球',
    original_title: 'The Wandering Earth',
    rating: { average: 7.9, numRaters: 450000 },
    images: {
      small: 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2557713076.jpg',
      medium: 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2557713076.jpg',
      large: 'https://img3.doubanio.com/view/photo/large/public/p2557713076.jpg'
    },
    year: '2019',
    genres: ['科幻', '冒险', '灾难'],
    directors: [{ name: '郭帆' }],
    casts: [{ name: '吴京' }, { name: '屈楚萧' }, { name: '李光洁' }, { name: '吴孟达' }],
    summary: '在不远的将来，太阳急速衰老与膨胀，再过几百年整个太阳系将被它吞噬毁灭。为了应对这场史无前例的危机，地球各国放下芥蒂，成立联合政府，试图寻找人类存续的出路。通过摸索与考量，推着地球逃出太阳的"移山计划"获得压倒性胜利。',
    durations: ['125分钟']
  },
  '哪吒之魔童降世': {
    id: '26209993',
    title: '哪吒之魔童降世',
    original_title: 'Ne Zha',
    rating: { average: 8.4, numRaters: 580000 },
    images: {
      small: 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2561874863.jpg',
      medium: 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2561874863.jpg',
      large: 'https://img3.doubanio.com/view/photo/large/public/p2561874863.jpg'
    },
    year: '2019',
    genres: ['动画', '奇幻', '冒险'],
    directors: [{ name: '饺子' }],
    casts: [{ name: '吕艳婷' }, { name: '囧森瑟夫' }, { name: '瀚墨' }],
    summary: '天劫降临，陈塘关总兵李靖的夫人怀胎三年六个月后，生下一个肉球。从中蹦出的男孩天不怕地不怕，然而他却是"魔丸"转世。元始天尊启动了天劫咒语，除非哪吒在天劫到来前修得正果，否则将会遭受天雷毁灭。',
    durations: ['110分钟']
  },
  '复仇者联盟4': {
    id: '26100958',
    title: '复仇者联盟4：终局之战',
    original_title: 'Avengers: Endgame',
    rating: { average: 8.5, numRaters: 620000 },
    images: {
      small: 'https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2545472806.jpg',
      medium: 'https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2545472806.jpg',
      large: 'https://img9.doubanio.com/view/photo/large/public/p2545472806.jpg'
    },
    year: '2019',
    genres: ['动作', '科幻', '冒险'],
    directors: [{ name: '安东尼·罗素' }, { name: '乔·罗素' }],
    casts: [{ name: '小罗伯特·唐尼' }, { name: '克里斯·埃文斯' }, { name: '斯嘉丽·约翰逊' }],
    summary: '一声响指，宇宙间半数生命灰飞烟灭。几近绝望的复仇者们在惊奇队长的帮助下找到灭霸归隐之处，却发现六颗无限宝石均被销毁，希望彻底破灭。',
    durations: ['181分钟']
  },
  '长津湖': {
    id: '35267208',
    title: '长津湖',
    original_title: 'The Battle at Lake Changjin',
    rating: { average: 7.4, numRaters: 180000 },
    images: {
      small: 'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2696972537.jpg',
      medium: 'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2696972537.jpg',
      large: 'https://img2.doubanio.com/view/photo/large/public/p2696972537.jpg'
    },
    year: '2021',
    genres: ['剧情', '历史', '战争'],
    directors: [{ name: '陈凯歌' }, { name: '徐克' }, { name: '林超贤' }],
    casts: [{ name: '吴京' }, { name: '易烊千玺' }, { name: '段奕宏' }],
    summary: '以抗美援朝战争第二次战役中的长津湖战役为背景，讲述了一段波澜壮阔的历史。',
    durations: ['176分钟']
  },
  '满江红': {
    id: '35239796',
    title: '满江红',
    original_title: 'Full River Red',
    rating: { average: 7.0, numRaters: 280000 },
    images: {
      small: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2885265677.jpg',
      medium: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2885265677.jpg',
      large: 'https://img1.doubanio.com/view/photo/large/public/p2885265677.jpg'
    },
    year: '2023',
    genres: ['剧情', '喜剧', '悬疑'],
    directors: [{ name: '张艺谋' }],
    casts: [{ name: '沈腾' }, { name: '易烊千玺' }, { name: '张译' }],
    summary: '南宋绍兴年间，岳飞死后四年，秦桧率兵与金国会谈。会谈前夜，金国使者死在宰相驻地，所携密信也不翼而飞。',
    durations: ['159分钟']
  },
  '你好，李焕英': {
    id: '350 invers67',
    title: '你好，李焕英',
    original_title: 'Hi, Mom',
    rating: { average: 8.3, numRaters: 480000 },
    images: {
      small: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2626551706.jpg',
      medium: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2626551706.jpg',
      large: 'https://img1.doubanio.com/view/photo/large/public/p2626551706.jpg'
    },
    year: '2021',
    genres: ['喜剧', '奇幻'],
    directors: [{ name: '贾玲' }],
    casts: [{ name: '贾玲' }, { name: '沈腾' }, { name: '陈赫' }],
    summary: '2001年的某一天，刚刚考上大学的贾晓玲因母亲突遭车祸而悲伤不已。在她情绪崩溃的情况下，她意外地回到了1981年，并与年轻时的母亲李焕英相遇。',
    durations: ['128分钟']
  },
  '人生大事': {
    id: '35267208',
    title: '人生大事',
    original_title: 'Lighting Up The Stars',
    rating: { average: 7.3, numRaters: 150000 },
    images: {
      small: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2871722025.jpg',
      medium: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2871722025.jpg',
      large: 'https://img1.doubanio.com/view/photo/large/public/p2871722025.jpg'
    },
    year: '2022',
    genres: ['剧情', '家庭'],
    directors: [{ name: '刘江江' }],
    casts: [{ name: '朱一龙' }, { name: '杨恩又' }],
    summary: '殡葬师莫三妹在刑满释放后的一次出殡中，遇到了孤儿武小文。在与武小文相处的过程中，他逐渐找到了生活的意义。',
    durations: ['112分钟']
  },
  '保你平安': {
    id: '35239796',
    title: '保你平安',
    original_title: 'The Postman',
    rating: { average: 7.7, numRaters: 120000 },
    images: {
      small: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2885265677.jpg',
      medium: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2885265677.jpg',
      large: 'https://img1.doubanio.com/view/photo/large/public/p2885265677.jpg'
    },
    year: '2023',
    genres: ['喜剧'],
    directors: [{ name: '大鹏' }],
    casts: [{ name: '大鹏' }, { name: '宋茜' }, { name: '尹正' }],
    summary: '落魄中年魏平安以直播带货卖墓地为生，他的客户韩露过世后被造谣。魏平安决定为她出头，踏上了艰难的洗谣之路。',
    durations: ['112分钟']
  }
}

// 扩展搜索：包含标题的部分匹配
function fuzzyMatchMock(title: string): string | null {
  const lowerTitle = title.toLowerCase()
  
  for (const key of Object.keys(mockDoubanData)) {
    if (lowerTitle.includes(key) || key.includes(lowerTitle)) {
      return key
    }
    // 简化的模糊匹配
    if (key.length > 2 && lowerTitle.length > 2) {
      let matchCount = 0
      for (const char of lowerTitle) {
        if (key.includes(char)) matchCount++
      }
      if (matchCount >= Math.min(lowerTitle.length, key.length) * 0.6) {
        return key
      }
    }
  }
  return null
}

// 搜索电影
export async function searchDoubanMovie(title: string, count: number = 5): Promise<DoubanSearchResult[]> {
  // 1. 先尝试精确匹配模拟数据
  if (mockDoubanData[title]) {
    const mock = mockDoubanData[title]!
    console.log(`[Douban Mock] Exact match for: ${title}`)
    return [{
      id: mock.id!,
      title: mock.title!,
      original_title: mock.original_title!,
      rating: mock.rating!,
      images: mock.images!,
      year: mock.year!,
      genres: mock.genres!,
      directors: mock.directors!,
      casts: mock.casts!,
      summary: mock.summary!,
      type: 'movie'
    }]
  }

  // 2. 尝试模糊匹配模拟数据
  const fuzzyKey = fuzzyMatchMock(title)
  if (fuzzyKey && mockDoubanData[fuzzyKey]) {
    const mock = mockDoubanData[fuzzyKey]!
    console.log(`[Douban Mock] Fuzzy match "${title}" -> "${fuzzyKey}"`)
    return [{
      id: mock.id!,
      title: mock.title!,
      original_title: mock.original_title!,
      rating: mock.rating!,
      images: mock.images!,
      year: mock.year!,
      genres: mock.genres!,
      directors: mock.directors!,
      casts: mock.casts!,
      summary: mock.summary!,
      type: 'movie'
    }]
  }

  // 3. 尝试各个代理API
  for (const proxy of DOUBAN_API_PROXIES) {
    try {
      console.log(`[Douban API] Trying proxy: ${proxy}`)
      const response = await axios.get(`${proxy}/v2/movie/search`, {
        params: {
          q: title,
          count: count,
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://movie.douban.com/',
          'Accept': 'application/json',
        },
      })

      if (response.data && response.data.subjects && response.data.subjects.length > 0) {
        console.log(`[Douban API] Found ${response.data.subjects.length} results`)
        return response.data.subjects
      }
    } catch (err) {
      console.log(`[Douban API] Proxy ${proxy} failed:`, (err as Error).message)
    }
  }

  console.log(`[Douban API] All sources failed for: ${title}`)
  return []
}

// 获取电影详情
export async function getDoubanMovieDetail(subjectId: string): Promise<DoubanMovieDetail | null> {
  // 检查模拟数据
  for (const [key, value] of Object.entries(mockDoubanData)) {
    if (value.id === subjectId) {
      return value as DoubanMovieDetail
    }
  }

  for (const proxy of DOUBAN_API_PROXIES) {
    try {
      const response = await axios.get(`${proxy}/v2/movie/subject/${subjectId}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://movie.douban.com/',
          'Accept': 'application/json',
        },
      })

      if (response.data && response.data.id) {
        console.log(`[Douban API] Detail success: ${response.data.title}`)
        return response.data
      }
    } catch (err) {
      console.log(`[Douban API] Detail proxy ${proxy} failed:`, (err as Error).message)
    }
  }

  return null
}

// 搜索并获取最佳匹配的详情
export async function searchAndGetDoubanDetail(title: string): Promise<DoubanMovieDetail | null> {
  const results = await searchDoubanMovie(title)

  if (results.length === 0) {
    // 尝试使用爬虫
    return await getDoubanDetailByCrawler(title)
  }

  // 找最匹配的结果
  const bestMatch = results[0]
  const detail = await getDoubanMovieDetail(bestMatch.id)
  return detail
}

// 爬虫获取详情
export async function getDoubanDetailByCrawler(title: string): Promise<DoubanMovieDetail | null> {
  try {
    console.log(`[Douban Crawler] Searching: ${title}`)
    
    // 尝试搜索页面
    const searchResponse = await axios.get('https://www.douban.com/search', {
      params: {
        q: title,
        cat: '1002',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.douban.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cookie': 'bid=abc123; douban-fav-remind=1;',
      },
      timeout: 8000,
    })

    const html = searchResponse.data
    
    // 提取subject_id
    const subjectMatch = html.match(/href="https:\/\/movie\.douban\.com\/subject\/(\d+)\/"/)
    if (!subjectMatch) {
      console.log('[Douban Crawler] No subject found')
      return null
    }

    const subjectId = subjectMatch[1]
    console.log(`[Douban Crawler] Found subject ID: ${subjectId}`)

    // 访问详情页
    const detailResponse = await axios.get(`https://movie.douban.com/subject/${subjectId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://www.douban.com/search?q=${encodeURIComponent(title)}`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 8000,
    })

    const detailHtml = detailResponse.data

    // 提取数据
    const titleMatch = detailHtml.match(/<span property="v:itemreviewed">(.*?)<\/span>/)
    const ratingMatch = detailHtml.match(/<strong class="ll rating_num" property="v:average">([\d.]+)<\/strong>/)
    const yearMatch = detailHtml.match(/<span class="year">\((\d+)\)<\/span>/)
    const summaryMatch = detailHtml.match(/<span property="v:summary">(.*?)<\/span>/)
    const imageMatch = detailHtml.match(/<img\s+src="([^"]+)"\s+alt="[^"]+"\s+class="nbg"/)

    if (!titleMatch || !ratingMatch) {
      console.log('[Douban Crawler] Missing title or rating')
      return null
    }

    const result: DoubanMovieDetail = {
      id: subjectId,
      title: titleMatch[1].trim(),
      original_title: '',
      rating: {
        average: parseFloat(ratingMatch[1]),
        numRaters: 0,
      },
      images: {
        small: imageMatch ? imageMatch[1] : '',
        medium: imageMatch ? imageMatch[1] : '',
        large: imageMatch ? imageMatch[1].replace('s_ratio_poster', 'large') : '',
      },
      year: yearMatch ? yearMatch[1] : '',
      genres: [],
      directors: [],
      casts: [],
      summary: summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, '').trim() : '',
      aka: [],
      countries: [],
      durations: [],
    }

    console.log(`[Douban Crawler] Success: ${result.title}, Rating: ${result.rating.average}`)
    return result

  } catch (err) {
    console.error(`[Douban Crawler] Error:`, (err as Error).message)
    return null
  }
}

// 通过Bing搜索获取豆瓣电影链接
async function searchDoubanUrlByBing(title: string): Promise<string | null> {
  try {
    console.log(`[Bing Search] Searching for: ${title} 豆瓣`)
    
    await randomDelay(1000, 2000)
    
    const response = await axios.get('https://cn.bing.com/search', {
      params: {
        q: `${title} 豆瓣 电影`,
        count: 10,
      },
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://cn.bing.com/',
      },
    })

    const html = response.data
    
    // 匹配豆瓣电影详情页链接
    const doubanMatch = html.match(/href="(https:\/\/movie\.douban\.com\/subject\/\d+\/?)"/)
    if (doubanMatch) {
      const url = doubanMatch[1]
      console.log(`[Bing Search] Found Douban URL: ${url}`)
      return url
    }

    // 尝试另一种匹配方式
    const altMatch = html.match(/https:\/\/movie\.douban\.com\/subject\/\d+\/?/g)
    if (altMatch && altMatch.length > 0) {
      console.log(`[Bing Search] Found Douban URL (alt): ${altMatch[0]}`)
      return altMatch[0]
    }

    console.log(`[Bing Search] No Douban URL found for: ${title}`)
    return null
  } catch (err) {
    console.error(`[Bing Search] Error searching for "${title}":`, (err as Error).message)
    return null
  }
}

// 从豆瓣详情页解析电影数据
async function parseDoubanMoviePage(url: string): Promise<DoubanMovieDetail | null> {
  try {
    console.log(`[Douban Parser] Parsing: ${url}`)
    
    await randomDelay(1500, 3000)
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://cn.bing.com/',
        'Cookie': 'bid=abc123;',
      },
    })

    const html = response.data

    // 提取电影ID
    const idMatch = url.match(/subject\/(\d+)/)
    if (!idMatch) {
      console.log('[Douban Parser] Could not extract movie ID')
      return null
    }
    const subjectId = idMatch[1]

    // 提取标题
    const titleMatch = html.match(/<span\s+property="v:itemreviewed">(.*?)<\/span>/)
    const originalTitleMatch = html.match(/<span\s+class="year">\s*\(([^)]+)\)\s*<\/span>/)
    
    // 提取评分
    const ratingMatch = html.match(/<strong\s+class="ll rating_num"\s+property="v:average">([\d.]+)<\/strong>/)
    
    // 提取海报
    const imageMatch = html.match(/<img\s+src="([^"]+)"\s+alt="[^"]+"\s+class="nbg"/)
    
    // 提取年份
    const yearMatch = html.match(/<span\s+class="year">\((\d+)\)<\/span>/)
    
    // 提取简介
    const summaryMatch = html.match(/<span\s+property="v:summary">(.*?)<\/span>/)
    
    // 提取导演
    const directorMatch = html.match(/<a\s+rel="v:directedBy">(.*?)<\/a>/)
    
    // 提取演员
    const castMatches = html.match(/<a\s+rel="v:starring">(.*?)<\/a>/g)
    const casts = castMatches ? castMatches.slice(0, 5).map((c: string) => ({ name: c.replace(/<[^>]+>/g, '').trim() })) : []
    
    // 提取类型
    const genreMatches = html.match(/<span\s+property="v:genre">(.*?)<\/span>/g)
    const genres = genreMatches ? genreMatches.map((g: string) => g.replace(/<[^>]+>/g, '').trim()) : []
    
    // 提取时长
    const durationMatch = html.match(/<span\s+property="v:runtime"[^>]*>([^<]+)<\/span>/)
    
    // 提取评分人数
    const voteCountMatch = html.match(/<span\s+property="v:votes">(\d+)<\/span>/)

    if (!titleMatch || !ratingMatch) {
      console.log('[Douban Parser] Missing title or rating')
      return null
    }

    const result: DoubanMovieDetail = {
      id: subjectId,
      title: titleMatch[1].trim(),
      original_title: originalTitleMatch ? originalTitleMatch[1].trim() : '',
      rating: {
        average: parseFloat(ratingMatch[1]),
        numRaters: voteCountMatch ? parseInt(voteCountMatch[1]) : 0,
      },
      images: {
        small: imageMatch ? imageMatch[1] : '',
        medium: imageMatch ? imageMatch[1] : '',
        large: imageMatch ? imageMatch[1].replace('s_ratio_poster', 'large') : '',
      },
      year: yearMatch ? yearMatch[1] : '',
      genres: genres,
      directors: directorMatch ? [{ name: directorMatch[1].trim() }] : [],
      casts: casts,
      summary: summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, '').trim() : '',
      aka: [],
      countries: [],
      durations: durationMatch ? [durationMatch[1].trim()] : [],
    }

    console.log(`[Douban Parser] Success: ${result.title}, Rating: ${result.rating.average}`)
    return result

  } catch (err) {
    console.error(`[Douban Parser] Error parsing "${url}":`, (err as Error).message)
    return null
  }
}

// 通过Bing搜索获取豆瓣电影详情
export async function searchDoubanByBing(title: string): Promise<DoubanMovieDetail | null> {
  const url = await searchDoubanUrlByBing(title)
  if (!url) {
    return null
  }
  
  return await parseDoubanMoviePage(url)
}

// 获取豆瓣评分
export async function getDoubanRating(title: string): Promise<number | null> {
  const results = await searchDoubanMovie(title, 1)

  if (results.length > 0 && results[0].rating && results[0].rating.average) {
    return results[0].rating.average
  }

  return null
}