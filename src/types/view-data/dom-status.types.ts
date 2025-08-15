export interface DomStatusResponse {
  dom_state: DomStatus
  current_tab_status: DomStatus
}

export type DomStatus =
  | 'DOM_LOADING'
  | 'WAITING'
  | 'NAVIGATING'
  | 'PAGE_LOADED'
  | 'SCRAPING'
  | 'DOM_LOADED'
  | 'ERROR'
