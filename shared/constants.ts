export const VIDEO_EXTS = ['.mkv', '.mp4', '.avi', '.webm', '.ts', '.mov', '.wmv'] as const
export const DIRECT_PLAY_EXTS = ['.mp4', '.webm', '.mkv', '.avi', '.mov'] as const
export const RATING_TOLERANCE = 0.8
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const POSTER_SIZES = {
  THUMB: 'w185',
  CARD: 'w342',
  FULL: 'w500',
  ORIGINAL: 'original',
} as const

export const METADATA_STATUS = {
  PENDING: 'pending',
  FETCHED: 'fetched',
  FAILED: 'failed',
} as const

export const SORT_OPTIONS = [
  { value: 'rating_desc', label: '评分从高到低' },
  { value: 'rating_asc', label: '评分从低到高' },
  { value: 'date_desc', label: '最新入库' },
  { value: 'title_asc', label: '标题排序' },
] as const

export const GENRES = [
  '全部',
  '剧情',
  '动作',
  '科幻',
  '喜剧',
  '恐怖',
  '纪录片',
  '动漫',
  '爱情',
  '悬疑',
  '惊悚',
  '冒险',
  '奇幻',
  '战争',
  '犯罪',
  '历史',
  '音乐',
  '家庭',
] as const
