// Standard success envelope returned by every endpoint in this API.
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// Standard error envelope returned by the global error handler.
export interface ApiErrorResponse {
  success: false;
  message: string;
}
