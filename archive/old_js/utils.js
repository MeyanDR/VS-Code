/* ========================================== */
/*            TROMKLUB UTILS MODULE          */
/*       Helper Functions & Utilities        */
/* ========================================== */

// ==========================================
//            DOM UTILITIES
// ==========================================

export function $(selector) {
    return document.querySelector(selector);
}

export function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on')) {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

export function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
        return true;
    }
    return false;
}

export function clearElement(element) {
    if (element) {
        element.innerHTML = '';
        return true;
    }
    return false;
}

export function toggleClass(element, className, condition = null) {
    if (!element) return false;
    
    if (condition === null) {
        element.classList.toggle(className);
    } else {
        element.classList.toggle(className, condition);
    }
    return true;
}

export function hasClass(element, className) {
    return element && element.classList.contains(className);
}

// ==========================================
//         PERFORMANCE UTILITIES
// ==========================================

export function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function requestAnimationFrame(callback) {
    return window.requestAnimationFrame || 
           window.webkitRequestAnimationFrame || 
           window.mozRequestAnimationFrame || 
           function(callback) { setTimeout(callback, 1000/60); };
}

export function cancelAnimationFrame(id) {
    const cancel = window.cancelAnimationFrame || 
                   window.webkitCancelAnimationFrame || 
                   window.mozCancelAnimationFrame ||
                   clearTimeout;
    return cancel(id);
}

// ==========================================
//           VALIDATION UTILITIES
// ==========================================

export function validateNumber(value, min = -Infinity, max = Infinity, defaultValue = 0) {
    const num = parseFloat(value);
    if (isNaN(num)) return defaultValue;
    return Math.min(Math.max(num, min), max);
}

export function validateInteger(value, min = -Infinity, max = Infinity, defaultValue = 0) {
    const int = parseInt(value, 10);
    if (isNaN(int)) return defaultValue;
    return Math.min(Math.max(int, min), max);
}

export function validateString(value, maxLength = Infinity, defaultValue = '') {
    if (typeof value !== 'string') return defaultValue;
    return value.length > maxLength ? value.substring(0, maxLength) : value;
}

export function sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') return '';
    
    let sanitized = input;
    
    if (options.stripHTML) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    if (options.stripScripts) {
        sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    
    if (options.maxLength) {
        sanitized = sanitized.substring(0, options.maxLength);
    }
    
    if (options.trim) {
        sanitized = sanitized.trim();
    }
    
    return sanitized;
}

export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ==========================================
//          FORMAT UTILITIES
// ==========================================

export function formatNumber(num, decimals = 2) {
    return parseFloat(num).toFixed(decimals);
}

export function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDate(date, format = 'YYYY-MM-DD') {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

export function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    } else if (minutes > 0) {
        return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    } else {
        return `0:${String(seconds).padStart(2, '0')}`;
    }
}

// ==========================================
//         ARRAY & OBJECT UTILITIES
// ==========================================

export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(deepClone);
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    return obj;
}

export function mergeObjects(target, ...sources) {
    for (const source of sources) {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                mergeObjects(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        });
    }
    return target;
}

export function arrayUnique(array) {
    return [...new Set(array)];
}

export function arrayChunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export function arrayFlatten(array) {
    return array.flat(Infinity);
}

export function arrayGroupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = typeof key === 'function' ? key(item) : item[key];
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
    }, {});
}

export function arraySort(array, key, direction = 'asc') {
    return array.sort((a, b) => {
        const valueA = typeof key === 'function' ? key(a) : a[key];
        const valueB = typeof key === 'function' ? key(b) : b[key];
        
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// ==========================================
//          STRING UTILITIES
// ==========================================

export function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function camelCase(str) {
    return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
}

export function kebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[_\s]+/g, '-');
}

export function snakeCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().replace(/[-\s]+/g, '_');
}

export function truncateString(str, length, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
}

export function padString(str, length, char = ' ', direction = 'left') {
    const padLength = length - str.length;
    if (padLength <= 0) return str;
    
    const padding = char.repeat(padLength);
    return direction === 'left' ? padding + str : str + padding;
}

export function generateSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==========================================
//          FILE UTILITIES
// ==========================================

export function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

export function getFileName(path) {
    return path.split('/').pop().split('\\').pop();
}

export function sanitizeFileName(filename) {
    return filename.replace(/[^a-z0-9.-]/gi, '_');
}

export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
    });
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadText(text, filename, mimeType = 'text/plain') {
    const blob = new Blob([text], { type: mimeType });
    downloadBlob(blob, filename);
}

export function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    downloadText(json, filename, 'application/json');
}

// ==========================================
//           MATH UTILITIES
// ==========================================

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

export function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

// ==========================================
//          COLOR UTILITIES
// ==========================================

export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

export function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1/3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1/3);
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

export function adjustBrightness(color, factor) {
    const rgb = typeof color === 'string' ? hexToRgb(color) : color;
    if (!rgb) return color;
    
    return rgbToHex(
        clamp(Math.round(rgb.r * factor), 0, 255),
        clamp(Math.round(rgb.g * factor), 0, 255),
        clamp(Math.round(rgb.b * factor), 0, 255)
    );
}

// ==========================================
//         STORAGE UTILITIES
// ==========================================

export function localStorageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('LocalStorage set error:', error);
        return false;
    }
}

export function localStorageGet(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('LocalStorage get error:', error);
        return defaultValue;
    }
}

export function localStorageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('LocalStorage remove error:', error);
        return false;
    }
}

export function sessionStorageSet(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('SessionStorage set error:', error);
        return false;
    }
}

export function sessionStorageGet(key, defaultValue = null) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('SessionStorage get error:', error);
        return defaultValue;
    }
}

// ==========================================
//         DEVICE DETECTION
// ==========================================

export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTablet() {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
}

export function isDesktop() {
    return !isMobile() && !isTablet();
}

export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getViewportSize() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

export function isVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const viewport = getViewportSize();
    
    return (
        rect.top < viewport.height &&
        rect.left < viewport.width &&
        rect.bottom > 0 &&
        rect.right > 0
    );
}

// ==========================================
//         ERROR HANDLING
// ==========================================

export function createError(message, code = null, data = null) {
    const error = new Error(message);
    if (code) error.code = code;
    if (data) error.data = data;
    return error;
}

export function logError(error, context = '') {
    console.error(`[${context}] Error:`, error);
    
    // Could integrate with error reporting service here
    if (typeof window !== 'undefined' && window.errorReporting) {
        window.errorReporting.log(error, context);
    }
}

export function handleAsyncError(asyncFunction) {
    return async (...args) => {
        try {
            return await asyncFunction(...args);
        } catch (error) {
            logError(error, asyncFunction.name);
            throw error;
        }
    };
}

// ==========================================
//      SYMBOL & STEP UTILITIES
// ==========================================

export function renderStepContent(step, options = {}) {
    const { symbol = 'x', modifiers = {} } = step;
    let content = symbol;
    
    if (modifiers.super) {
        content += `^${modifiers.super}`;
    }
    if (modifiers.sub) {
        content += `_${modifiers.sub}`;
    }
    
    return content;
}

export function parseStepKey(stepKey) {
    const parts = stepKey.split('-');
    return {
        bar: parseInt(parts[0], 10),
        beat: parseInt(parts[1], 10),
        step: parseInt(parts[2], 10)
    };
}

export function createStepKey(bar, beat, step) {
    return `${bar}-${beat}-${step}`;
}

export function getStepPosition(stepKey, section) {
    const { bar, beat, step } = parseStepKey(stepKey);
    const beatsPerBar = section.beats || 4;
    const subdivision = section.subdivision || 4;
    
    return {
        absoluteStep: (bar * beatsPerBar * subdivision) + (beat * subdivision) + step,
        bar,
        beat,
        step
    };
}

// ==========================================
//         EXPORT UTILITIES
// ==========================================

export function generateExportFilename(projectName, format, timestamp = true) {
    let filename = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    if (timestamp) {
        const now = new Date();
        const dateStr = formatDate(now, 'YYYY-MM-DD_HH-mm-ss');
        filename += `_${dateStr}`;
    }
    
    return `${filename}.${format}`;
}

export function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.prepend(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        } finally {
            textArea.remove();
        }
    }
}

// ==========================================
//         MODULE EXPORTS
// ==========================================

// Make functions available globally for backwards compatibility
export function attachToWindow() {
    if (typeof window !== 'undefined') {
        // Add most commonly used utilities to window
        window.$ = $;
        window.$$ = $$;
        window.debounce = debounce;
        window.throttle = throttle;
        window.validateNumber = validateNumber;
        window.validateInteger = validateInteger;
        window.sanitizeInput = sanitizeInput;
        window.deepClone = deepClone;
        window.generateId = generateId;
        window.formatDate = formatDate;
        window.downloadJSON = downloadJSON;
        window.downloadText = downloadText;
    }
}

// Auto-attach if in browser
if (typeof window !== 'undefined') {
    attachToWindow();
}

console.log('TROMKLUB Utils module loaded successfully');