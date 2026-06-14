/**
 * 拼音首字母搜索工具
 * 将中文转换为拼音首字母，支持搜索匹配
 */

import pinyin from 'pinyin'

/**
 * 将中文字符串转换为拼音首字母
 * 例如："利刃出鞘" -> "lrcq"
 */
export function getPinyinInitials(chinese: string): string {
  if (!chinese) return ''

  try {
    // 使用 pinyin 库获取拼音
    const pinyinArray = pinyin(chinese, {
      style: pinyin.STYLE_FIRST_LETTER, // 首字母风格
      heteronym: false, // 不显示多音字
    })

    // 转换为字符串
    return pinyinArray.map(item => item[0]).join('').toLowerCase()
  } catch {
    return ''
  }
}

/**
 * 搜索匹配函数
 * 支持：中文名、英文名、拼音首字母
 */
export function matchSearch(text: string, query: string): boolean {
  if (!text || !query) return false

  const normalizedText = text.toLowerCase().trim()
  const normalizedQuery = query.toLowerCase().trim()

  // 1. 直接匹配（中文或英文）
  if (normalizedText.includes(normalizedQuery)) {
    return true
  }

  // 2. 拼音首字母匹配（用于中文搜索）
  // 只有当查询全是英文字母时才尝试拼音匹配
  if (/^[a-z]+$/.test(normalizedQuery)) {
    const pinyinInitials = getPinyinInitials(text)
    if (pinyinInitials.includes(normalizedQuery)) {
      return true
    }
  }

  return false
}
