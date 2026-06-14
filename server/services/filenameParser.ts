import path from 'path'
import type { ParsedFilename, ParsedDirName, ParsedEpisodeName } from '../../shared/types'

const SEASON_PATTERN = /S(\d{1,2})/i
const EPISODE_PATTERN = /(?:E(\d{1,3})|\b(\d{2,3})\b)(?!\d)/

// 常见的视频文件扩展名
const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts', '.rmvb']

// 提取【】中的内容
function extractBrackets(content: string): string[] {
  const results: string[] = []
  const regex = /【([^】]+)】/g
  let match
  while ((match = regex.exec(content)) !== null) {
    results.push(match[1])
  }
  return results
}

// 检查是否为有效的评分格式（纯数字或小数）
function isValidRating(value: string): boolean {
  if (!value) return false
  // N.N 不是有效评分，应该视为无效
  if (value.toUpperCase() === 'N.N') return false
  // 必须是纯数字格式（如 8.5, 9.0）
  return /^\d+(\.\d+)?$/.test(value)
}

// 获取文件扩展名（只识别常见的视频扩展名，避免Windows路径分隔符问题）
function getFileExt(fileName: string): string {
  const lower = fileName.toLowerCase()
  for (const ext of VIDEO_EXTS) {
    if (lower.endsWith(ext)) {
      return ext
    }
  }
  return ''
}

export function parseFilename(fileName: string): ParsedFilename {
  const ext = getFileExt(fileName)
  const nameWithoutExt = ext ? fileName.slice(0, -ext.length) : fileName
  
  // 提取所有【】中的内容
  const brackets = extractBrackets(nameWithoutExt)
  
  let rating: number | null = null
  let genre: string | null = null
  let titlePart: string = nameWithoutExt
  
  if (brackets.length >= 1) {
    const first = brackets[0]
    if (isValidRating(first)) {
      // 第一个是评分
      rating = parseFloat(first)
      if (brackets.length >= 2) {
        // 第二个是分类
        genre = brackets[1]
      }
    } else {
      // 第一个不是有效评分，检查第二个
      if (brackets.length >= 2) {
        const second = brackets[1]
        if (isValidRating(second)) {
          // 第二个是评分，第一个可能是无效评分（如N.N占位符）或分类
          // 跳过第一个，检查第三个
          if (brackets.length >= 3) {
            genre = brackets[2]
          }
          rating = parseFloat(second)
        } else {
          // 第二个也不是评分，第一个和第二个都是分类或无效内容
          // 跳过第一个，使用第二个作为分类
          genre = second
        }
      }
    }
    
    // 找到最后一个【】的位置，获取标题部分
    const lastBracketIndex = nameWithoutExt.lastIndexOf('】')
    titlePart = nameWithoutExt.substring(lastBracketIndex + 1)
  }
  
  // 从标题部分提取中文和英文
  let titleCN: string | null = null
  let titleEN: string | null = null
  
  // 先移除季号标记（如 S01, S02），这些不应该成为英文名的一部分
  let cleanTitlePart = titlePart.replace(/[.·\s]*S\d{1,2}(?:\.\w+)*$/i, '')
  
  // 如果清理后为空或太短，使用原始标题
  if (!cleanTitlePart || cleanTitlePart.length < 3) {
    cleanTitlePart = titlePart
  }
  
  // 尝试从标题中提取英文部分（通常在标题末尾，用.分隔）
  const titleParts = cleanTitlePart.split(/\s*\.\s*/)
  const englishParts: string[] = []
  
  for (const part of titleParts) {
    const trimmed = part.trim()
    // 只保留有意义的英文部分（排除单独的冠词和介词）
    if (/^[a-zA-Z]+$/.test(trimmed) && !['a', 'an', 'the', 'of', 'at', 'in', 'on', 'for', 'to'].includes(trimmed.toLowerCase())) {
      englishParts.push(trimmed)
    }
  }
  
  // 如果有多个英文单词组成英文名
  if (englishParts.length >= 2) {
    titleEN = englishParts.join(' ')
  } else if (englishParts.length === 1 && englishParts[0].length > 2) {
    // 只有一个较长的英文单词
    titleEN = englishParts[0]
  }
  
  // 提取中文标题
  const cnMatch = titlePart.match(/^([\u4e00-\u9fa5]+(?:[·・:：][\u4e00-\u9fa5]+)*)/)
  if (cnMatch) {
    titleCN = cnMatch[1].trim()
  }
  
  // 如果没有找到中文标题，使用整个标题
  if (!titleCN) {
    titleCN = titlePart || null
  }
  
  return {
    rating,
    genre,
    titleCN,
    titleEN,
    ext,
  }
}

export function parseDirName(dirName: string): ParsedDirName {
  const parsed = parseFilename(dirName)
  
  const seasonMatch = dirName.match(SEASON_PATTERN)
  const seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 1
  const seasonLabel = seasonMatch ? `S${String(seasonNumber).padStart(2, '0')}` : null
  
  return {
    ...parsed,
    seasonLabel,
    seasonNumber,
  }
}

export function parseEpisodeName(fileName: string, defaultSeason: number = 1): ParsedEpisodeName {
  const ext = getFileExt(fileName)
  const nameWithoutExt = ext ? fileName.slice(0, -ext.length) : fileName
  
  let seasonNumber = defaultSeason
  let episodeNumber = 0
  
  const seasonMatch = nameWithoutExt.match(SEASON_PATTERN)
  if (seasonMatch) {
    seasonNumber = parseInt(seasonMatch[1])
  }
  
  const episodeMatch = nameWithoutExt.match(EPISODE_PATTERN)
  if (episodeMatch) {
    episodeNumber = parseInt(episodeMatch[1] || episodeMatch[2])
  }
  
  if (episodeNumber === 0) {
    const numMatch = nameWithoutExt.match(/(\d{1,3})/)
    if (numMatch) {
      episodeNumber = parseInt(numMatch[1])
    }
  }
  
  return {
    seasonNumber,
    episodeNumber: Math.max(episodeNumber, 1),
    ext,
  }
}
