import { pinyin } from 'pinyin-pro'

/**
 * 生成搜索关键字（拼音首字母）
 * 中文：取拼音首字母
 * 英文：取单词首字母
 * 数字/特殊字符：保留原样
 */
export function generateSearchKey(title: string): string {
  if (!title) return ''

  let key = ''

  for (const char of title) {
    const code = char.charCodeAt(0)

    // 中文字符范围
    if (code >= 0x4E00 && code <= 0x9FA5) {
      // 使用 pinyin-pro 获取拼音首字母
      const initial = pinyin(char, { pattern: 'first' })
      key += initial.toLowerCase()
    } else if (/[a-zA-Z]/.test(char)) {
      // 英文字母，保留（大写转小写）
      key += char.toLowerCase()
    } else if (/[0-9]/.test(char)) {
      // 数字，保留
      key += char
    }
    // 其他字符（空格、标点等）跳过
  }

  return key
}

/**
 * 为标题生成完整的搜索关键字
 * 同时处理中文标题和英文标题
 */
export function generateFullSearchKey(titleCN: string | null | undefined, titleEN: string | null | undefined): string {
  const keys: string[] = []

  if (titleCN) {
    keys.push(generateSearchKey(titleCN))
  }

  if (titleEN) {
    // 英文标题取每个单词的首字母
    const words = titleEN.split(/[\s_-]+/)
    const enKey = words.map(w => w.charAt(0).toLowerCase()).join('')
    if (enKey) {
      keys.push(enKey)
    }
  }

  return keys.join('')
}