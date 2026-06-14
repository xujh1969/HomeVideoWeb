import axios from 'axios'
import { DOUBAN_BASE_URL } from '../config'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export async function searchDoubanMovie(title: string): Promise<{ rating: number; url: string } | null> {
  try {
    const response = await axios.get(`${DOUBAN_BASE_URL}/search`, {
      params: {
        q: title,
        cat: '1002',
      },
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
    })
    
    const html = response.data
    const ratingMatch = html.match(/<span class="rating_nums">([\d.]+)<\/span>/)
    const urlMatch = html.match(/<a href="(https:\/\/movie\.douban\.com\/subject\/\d+\/)"/)
    
    if (ratingMatch && urlMatch) {
      return {
        rating: parseFloat(ratingMatch[1]),
        url: urlMatch[1],
      }
    }
    return null
  } catch {
    return null
  }
}

export async function getDoubanRating(movieUrl: string): Promise<number | null> {
  try {
    const response = await axios.get(movieUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
    })
    
    const html = response.data
    const ratingMatch = html.match(/<strong class="ll rating_num" property="v:average">([\d.]+)<\/strong>/)
    
    if (ratingMatch) {
      return parseFloat(ratingMatch[1])
    }
    return null
  } catch {
    return null
  }
}

export async function searchAndGetRating(title: string): Promise<number | null> {
  const result = await searchDoubanMovie(title)
  if (result) {
    return result.rating
  }
  return null
}
