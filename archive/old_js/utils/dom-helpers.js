/**
 * DOM Helper Utilities
 * Pure functions for common DOM operations
 */

/**
 * Query selector with error handling
 */
export const $ = (selector, parent = document) => {
    try {
        return parent.querySelector(selector);
    } catch (error) {
        console.error(`Invalid selector: ${selector}`, error);
        return null;
    }
};

/**
 * Query selector all with error handling
 */
export const $$ = (selector, parent = document) => {
    try {
        return Array.from(parent.querySelectorAll(selector));
    } catch (error) {
        console.error(`Invalid selector: ${selector}`, error);
        return [];
    }
};

/**
 * Create element with attributes and children
 */
export const createElement = (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('data-')) {
            element.dataset[key.slice(5)] = value;
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Add children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
};

/**
 * Add event listener with automatic cleanup
 */
export const on = (element, event, handler, options = {}) => {
    if (!element || !event || !handler) return () => {};
    
    element.addEventListener(event, handler, options);
    
    // Return cleanup function
    return () => {
        element.removeEventListener(event, handler, options);
    };
};

/**
 * Add multiple event listeners
 */
export const onMultiple = (element, events, handler, options = {}) => {
    const cleanups = events.map(event => on(element, event, handler, options));
    
    // Return cleanup function for all events
    return () => {
        cleanups.forEach(cleanup => cleanup());
    };
};

/**
 * Toggle class on element
 */
export const toggleClass = (element, className, force) => {
    if (!element) return false;
    return element.classList.toggle(className, force);
};

/**
 * Add classes to element
 */
export const addClass = (element, ...classNames) => {
    if (!element) return;
    element.classList.add(...classNames);
};

/**
 * Remove classes from element
 */
export const removeClass = (element, ...classNames) => {
    if (!element) return;
    element.classList.remove(...classNames);
};

/**
 * Check if element has class
 */
export const hasClass = (element, className) => {
    if (!element) return false;
    return element.classList.contains(className);
};

/**
 * Set multiple styles on element
 */
export const setStyles = (element, styles) => {
    if (!element || !styles) return;
    Object.assign(element.style, styles);
};

/**
 * Get element position relative to viewport
 */
export const getPosition = (element) => {
    if (!element) return { top: 0, left: 0, width: 0, height: 0 };
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom
    };
};

/**
 * Check if element is visible in viewport
 */
export const isInViewport = (element, partial = false) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    
    if (partial) {
        return rect.bottom > 0 &&
               rect.right > 0 &&
               rect.top < window.innerHeight &&
               rect.left < window.innerWidth;
    }
    
    return rect.top >= 0 &&
           rect.left >= 0 &&
           rect.bottom <= window.innerHeight &&
           rect.right <= window.innerWidth;
};

/**
 * Smooth scroll to element
 */
export const scrollToElement = (element, options = {}) => {
    if (!element) return;
    
    const defaultOptions = {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
};

/**
 * Debounce function
 */
export const debounce = (func, wait = 300) => {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function
 */
export const throttle = (func, limit = 100) => {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Empty element (remove all children)
 */
export const empty = (element) => {
    if (!element) return;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

/**
 * Replace element content
 */
export const setContent = (element, content) => {
    if (!element) return;
    
    empty(element);
    
    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content instanceof Node) {
        element.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(child => {
            if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    }
};

/**
 * Get form data as object
 */
export const getFormData = (form) => {
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        if (data[key]) {
            // Handle multiple values for same key
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }
    
    return data;
};

/**
 * Show/hide element with optional animation
 */
export const show = (element, display = 'block') => {
    if (!element) return;
    element.style.display = display;
};

export const hide = (element) => {
    if (!element) return;
    element.style.display = 'none';
};

/**
 * Fade in/out with CSS transitions
 */
export const fadeIn = (element, duration = 300) => {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        element.style.opacity = '0';
        element.style.display = 'block';
        element.style.transition = `opacity ${duration}ms`;
        
        // Force reflow
        element.offsetHeight;
        
        element.style.opacity = '1';
        
        setTimeout(() => {
            element.style.transition = '';
            resolve();
        }, duration);
    });
};

export const fadeOut = (element, duration = 300) => {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
            element.style.transition = '';
            element.style.opacity = '';
            resolve();
        }, duration);
    });
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback method
        const textarea = createElement('textarea', {
            value: text,
            style: { position: 'fixed', left: '-9999px' }
        });
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (err) {
            document.body.removeChild(textarea);
            console.error('Failed to copy text:', err);
            return false;
        }
    }
};

/**
 * Download data as file
 */
export const downloadFile = (data, filename, mimeType = 'application/octet-stream') => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = createElement('a', {
        href: url,
        download: filename,
        style: { display: 'none' }
    });
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Parse HTML string to DOM elements
 */
export const parseHTML = (html) => {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.childNodes;
};

/**
 * Escape HTML to prevent XSS
 */
export const escapeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

export default {
    $,
    $$,
    createElement,
    on,
    onMultiple,
    toggleClass,
    addClass,
    removeClass,
    hasClass,
    setStyles,
    getPosition,
    isInViewport,
    scrollToElement,
    debounce,
    throttle,
    empty,
    setContent,
    getFormData,
    show,
    hide,
    fadeIn,
    fadeOut,
    copyToClipboard,
    downloadFile,
    parseHTML,
    escapeHTML
};