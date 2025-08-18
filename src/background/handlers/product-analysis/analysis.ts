import { sendMessage } from 'webext-bridge/background'
import { SSE_ERROR, SSE_UPDATE } from '~/constants/system/message-types'
import { API_BASE_URL, API_ENDPOINTS } from '~/constants/api/api'

// Active connections
const activeEventSources = new Map<string, EventSource>()

// Aactive jobs
const activeTabJobs = new Map<number, string>()

/* eslint-disable no-console */

/**
 * Initiates and manages sse connection for a given analysis job ID.
 * Handles receiving messages, forwarding them via runtime messaging, and closing the connection.
 * @param {string} jobId - The unique ID for the analysis job to connect to.
 */
export function analysisHandler(jobId: string, sseToken: string, tabId: number): void {
  // --- Close existing source if one exists for this job ---
  if (activeEventSources.has(jobId)) {
    activeEventSources.get(jobId)?.close()
    activeEventSources.delete(jobId)
  }

  // --- 1. Create the EventSource URL ---
  const SSE_URL = `${API_BASE_URL}${API_ENDPOINTS.ANALYSIS_STATUS(jobId)}?sseToken=${sseToken}`

  try {
    // --- 2. Create & Store EventSource ---
    const eventSource = new EventSource(SSE_URL)
    activeEventSources.set(jobId, eventSource)

    // --- 2b. Create & Store active job ---
    activeTabJobs.set(tabId, jobId)

    // --- 3. Handle Incoming Messages ---
    eventSource.onmessage = (event) => {
      try {
        const statusUpdate = JSON.parse(event.data)
        // Forward message
        sendMessage(SSE_UPDATE, { jobId, data: statusUpdate, message: 'STEP_SUCCESSFUL' }, { context: 'popup', tabId })
          .catch(e => console.error('BG: Failed to send SSE_UPDATE', e))

        // Check for final messages
        if (statusUpdate.step === 100 || statusUpdate.step === -99) {
          eventSource.close()
          activeEventSources.delete(jobId)
        }
      }
      catch (e) {
        console.error(`Background: Failed to parse SSE data for job ${jobId}:`, event.data, e)
        sendMessage(SSE_ERROR, { jobId, message: 'STATUS_ERROR' }, { context: 'popup', tabId })
          .catch(e => console.error('BG: Failed to send SSE_ERROR', e))
      }
    }

    // --- 4. Handle Connection Errors ---
    eventSource.onerror = (error) => {
      console.error(`Background: EventSource error for job ${jobId}:`, error)
      sendMessage(SSE_ERROR, { jobId, message: 'STATUS_ERROR' }, { context: 'popup', tabId })
        .catch(e => console.error('BG: Failed to send SSE_ERROR', e))
      eventSource.close()
      activeEventSources.delete(jobId)
    }

    // Handle the 'open' event
    eventSource.onopen = () => {
      console.log(`Background: EventSource connection opened successfully for job ${jobId}`)
    }
  }
  catch (e) {
    console.error(`Background: Failed to create EventSource for job ${jobId}:`, e)
    sendMessage(SSE_ERROR, { jobId, message: 'STATUS_ERROR' }, { context: 'popup', tabId })
      .catch(e => console.error('BG: Failed to send SSE_ERROR', e))
  }
}

/**
 * Manually stops and cleans up an active SSE connection for a given job ID.
 * @param {string} jobId - The unique ID for the analysis job to stop.
 */
export function stopAnalysisHandler(jobId: string, tabId: number): void {
  const eventSource = activeEventSources.get(jobId)
  activeTabJobs.delete(tabId)
  if (eventSource) {
    eventSource.close()
    activeEventSources.delete(jobId)
  }
}

/**
 * Stops any active analysis associated with a specific tab ID.
 * This is crucial for cleaning up when the user navigates away.
 * @param {number} tabId - The ID of the tab to stop analysis for.
 */
export function stopAnalysisForTab(tabId: number): void {
  const jobId = activeTabJobs.get(tabId)
  if (jobId) {
    stopAnalysisHandler(jobId, tabId)
  }
}
