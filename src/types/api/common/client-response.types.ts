// A successful response where 'ok' is true
interface ApiSuccessResponse<T> {
  ok: true
  status: number
  data: T
  [key: string]: any
}

// A failed response where 'ok' is false
interface ApiErrorResponse {
  ok: false
  status: number
  data: { message: string } // The data is always the error message object
  [key: string]: any
}

// The final type is a union of the two possibilities
export type ApiClientResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
