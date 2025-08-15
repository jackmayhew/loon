export interface StartAnalysisSuccessResponse {
  status: 'started'
  jobId: string
  sseToken: string
}

export interface StartAnalysisErrorResponse {
  status: 'error'
  message: string
  jobId?: string
  error?: string
}

export type StartAnalysisResponse = StartAnalysisSuccessResponse | StartAnalysisErrorResponse

/**
 * A TypeScript type guard that validates the structure of an unknown object at runtime.
 * It ensures the received data safely conforms to the `StartAnalysisResponse` interface
 * before it's used, preventing errors from malformed message payloads.
 *
 * @param data The unknown data received from a message.
 * @returns {boolean} `true` if the data is a valid `StartAnalysisResponse`.
 */
export function isStartAnalysisResponse(data: unknown): data is StartAnalysisResponse {
  if (typeof data !== 'object' || data === null)
    return false

  const response = data as Record<string, unknown>

  if (response.status === 'started') {
    return typeof response.jobId === 'string' && typeof response.sseToken === 'string'
  }

  if (response.status === 'error') {
    return typeof response.message === 'string'
  }

  return false
}
