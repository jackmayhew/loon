import type { AlternativeProduct } from '../products/alternative/alternative-product.types'
import type { FindAlternativesResult } from '~/types/api/alternatives/response.types'

/**
 * The data payload for a single Server-Sent Event (SSE) update.
 * This represents the progress of a product or cart analysis job.
 */
export interface SseUpdatePayload {
  step: number
  message: string
  results: AlternativeProduct[]
  error?: any
  resultPayload?: FindAlternativesResult
}

/**
 * An SSE message indicating a successful progress update.
 */
export interface SseUpdateMessage {
  type: 'SSE_UPDATE'
  jobId: string
  data: SseUpdatePayload
  [key: string]: any // TODO: Remove this hack - conflicts with JsonValue constraint but required for onMessage<T> generic

}

/**
 * An SSE message indicating a fatal error in the analysis job.
 */
export interface SseErrorMessage {
  type: 'SSE_ERROR'
  jobId: string
  message?: string
  error?: any // Consider creating a specific error type
}

/**
 * A union type representing all possible messages sent over the SSE connection.
 */
export type SseMessage = SseUpdateMessage | SseErrorMessage
