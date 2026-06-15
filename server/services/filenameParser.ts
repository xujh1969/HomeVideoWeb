import path from 'path'
import type { ParsedFilename, ParsedDirName, ParsedEpisodeName } from '../../shared/types'

const SEASON_PATTERN = /S(\d{1,2})/i
const EPISODE_PATTERN = /(?:E(\d{1,3})|\b(\d{2,3})\b)(?!\d)/

const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts', '.rmvb']

function isValidRating(value: string): boolean {
  if (!value) return false
  if (value.toUpperCase() === 'N.N') return false
  return /^\d+(\.\d+)?$/.test(value)
}

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
  
  let rating: number | null = null
  let genre: string | null = null
  let titlePart: string = nameWithoutExt
  
  const bracketMatches = nameWithoutExt.match(/【([^】]+)】/g) || []
  
  if (bracketMatches.length >= 1) {
    let validBrackets: string[] = []
    
    for (const bracket of bracketMatches) {
      const content = bracket.slice(1, -1)
      if (content.toUpperCase() !== 'N.N') {
        validBrackets.push(content)
      }
    }
    
    if (validBrackets.length >= 1) {
      if (isValidRating(validBrackets[0])) {
        rating = parseFloat(validBrackets[0])
        if (validBrackets.length >= 2) {
          if (!isValidRating(validBrackets[1])) {
            genre = validBrackets[1]
          } else if (validBrackets.length >= 3) {
            genre = validBrackets[2]
          }
        }
      } else {
        genre = validBrackets[0]
        if (validBrackets.length >= 2 && isValidRating(validBrackets[1])) {
          rating = parseFloat(validBrackets[1])
        }
      }
    }
    
    const lastBracketIndex = nameWithoutExt.lastIndexOf('】')
    if (lastBracketIndex !== -1 && lastBracketIndex + 1 < nameWithoutExt.length) {
      titlePart = nameWithoutExt.substring(lastBracketIndex + 1).trim()
    } else {
      titlePart = nameWithoutExt.replace(/【[^】]+】/g, '').trim()
    }
  }
  
  titlePart = titlePart.replace(/^\s*[._-]+\s*/, '').replace(/\s*[._-]+\s*$/, '')
  
  let titleCN: string | null = null
  let titleEN: string | null = null
  
  let cleanTitlePart = titlePart.replace(/[.·\s]*S\d{1,2}(?:\.\w+)*$/i, '')
  
  if (!cleanTitlePart || cleanTitlePart.length < 3) {
    cleanTitlePart = titlePart
  }
  
  const titleParts = cleanTitlePart.split(/\s*\.\s*/)
  const englishParts: string[] = []
  
  for (const part of titleParts) {
    const trimmed = part.trim()
    if (/^[a-zA-Z]+$/.test(trimmed) && !['a', 'an', 'the', 'of', 'at', 'in', 'on', 'for', 'to'].includes(trimmed.toLowerCase())) {
      englishParts.push(trimmed)
    }
  }
  
  if (englishParts.length >= 2) {
    titleEN = englishParts.join(' ')
  } else if (englishParts.length === 1 && englishParts[0].length > 2) {
    titleEN = englishParts[0]
  }
  
  const cnMatch = titlePart.match(/[\u4e00-\u9fa5]+(?:[·・:：][\u4e00-\u9fa5]+)*/)
  if (cnMatch) {
    titleCN = cnMatch[0].trim()
  }
  
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