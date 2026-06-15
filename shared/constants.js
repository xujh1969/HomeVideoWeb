"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENRES = exports.SORT_OPTIONS = exports.METADATA_STATUS = exports.POSTER_SIZES = exports.TMDB_IMAGE_BASE = exports.RATING_TOLERANCE = exports.DIRECT_PLAY_EXTS = exports.VIDEO_EXTS = void 0;
exports.VIDEO_EXTS = ['.mkv', '.mp4', '.avi', '.webm', '.ts', '.mov', '.wmv'];
exports.DIRECT_PLAY_EXTS = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
exports.RATING_TOLERANCE = 0.8;
exports.TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
exports.POSTER_SIZES = {
    THUMB: 'w185',
    CARD: 'w342',
    FULL: 'w500',
    ORIGINAL: 'original',
};
exports.METADATA_STATUS = {
    PENDING: 'pending',
    FETCHED: 'fetched',
    FAILED: 'failed',
};
exports.SORT_OPTIONS = [
    { value: 'rating_desc', label: '评分从高到低' },
    { value: 'rating_asc', label: '评分从低到高' },
    { value: 'date_desc', label: '最新入库' },
    { value: 'title_asc', label: '标题排序' },
];
exports.GENRES = [
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
];
