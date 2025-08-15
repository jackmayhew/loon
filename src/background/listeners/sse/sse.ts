import { onMessage } from 'webext-bridge/background'
import { analysisHandler, stopAnalysisHandler } from '~/background/handlers/product-analysis/analysis'
import { START_SSE_LISTENING, STOP_SSE_LISTENING } from '~/constants/system/message-types'

// TODO: Validate tabId

/**
 * Catches the START_SSE_LISTENING message from the UI and routes the job details
 * to the handler that manages the actual EventSource connection
 */
onMessage<{ jobId: string, tabId: number, sseToken: string }>(START_SSE_LISTENING, ({ data }) => {
  const { jobId, sseToken, tabId } = data
  if (jobId) {
    analysisHandler(jobId, sseToken, tabId)
  }
  else {
    console.warn('Background: Received START_SSE_LISTENING without jobId in payload.')
  }
})

/**
 * Listens for messages to manually stop an SSE connection.
 * This is primarily used as a failsafe triggered by a timeout in the UI,
 * but can be called from any part of the extension.
 */
onMessage<{ jobId: string, tabId: number }>(STOP_SSE_LISTENING, ({ data }) => {
  const { jobId, tabId } = data
  if (jobId) {
    stopAnalysisHandler(jobId, tabId)
  }
})
