// --- Extension Lifecycle & Control ---
export const RESET_AND_ANALYZE_TAB = 'RESET_AND_ANALYZE_TAB'
export const TRIGGER_REFRESH = 'TRIGGER_REFRESH'

// --- ViewData Caching ---
export const CACHE_COMPLETE_VIEW_DATA = 'CACHE_COMPLETE_VIEW_DATA'

// --- Content Script Communication ---
export const TRIGGER_SCRAPE = 'TRIGGER_SCRAPE'
export const PING = 'PING'
export const PONG = 'PONG'
export const CS_READY = 'CS_READY'
export const GET_MY_TAB_ID = 'GET_MY_TAB_ID'
export const CS_BFCACHE_RESTORE = 'CS_BFCACHE_RESTORE'

// --- Background to Backend Communication ---
export const API_CALL = 'API_CALL'
export const START_PRODUCT_ANALYSIS = 'START_PRODUCT_ANALYSIS'
export const START_CART_ITEM_ANALYSIS = 'START_CART_ITEM_ANALYSIS'

// --- Server-Sent Events (SSE) ---
export const SSE_UPDATE = 'SSE_UPDATE'
export const SSE_ERROR = 'SSE_ERROR'
export const START_SSE_LISTENING = 'START_SSE_LISTENING'
export const STOP_SSE_LISTENING = 'STOP_SSE_LISTENING'

// --- Analytics ---
export const TRACK_OUTBOUND_CLICK = 'TRACK_OUTBOUND_CLICK'

// --- Popup to Backend Communication ---
export const RETRY_TRIGGER_SCRAPE = 'RETRY_TRIGGER_SCRAPE'
