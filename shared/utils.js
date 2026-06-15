"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFileSize = formatFileSize;
exports.formatRuntime = formatRuntime;
exports.formatDate = formatDate;
exports.getRatingColor = getRatingColor;
exports.getRatingClass = getRatingClass;
exports.parseRating = parseRating;
function formatFileSize(bytes) {
    if (bytes === null || bytes === undefined)
        return '-';
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024)
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
function formatRuntime(minutes) {
    if (minutes === null || minutes === undefined)
        return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0)
        return `${hours}小时${mins}分钟`;
    return `${mins}分钟`;
}
function formatDate(dateStr) {
    if (!dateStr)
        return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    catch {
        return dateStr;
    }
}
function getRatingColor(rating) {
    if (rating === null || rating === undefined)
        return 'text-text-tertiary';
    if (rating >= 8.0)
        return 'text-rating-high';
    if (rating >= 6.0)
        return 'text-rating-mid';
    return 'text-rating-low';
}
function getRatingClass(rating) {
    if (rating === null || rating === undefined)
        return 'bg-text-tertiary/30';
    if (rating >= 8.0)
        return 'bg-rating-high';
    if (rating >= 6.0)
        return 'bg-rating-mid';
    return 'bg-rating-low';
}
function parseRating(ratingStr) {
    const match = ratingStr.match(/([\d.]+)/);
    if (match) {
        const num = parseFloat(match[1]);
        return num >= 0 && num <= 10 ? num : null;
    }
    return null;
}
