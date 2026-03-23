export class ApiError extends Error {
  constructor(message: string, public statusCode: number, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }

  get isAuthError(): boolean {
    return this.statusCode === 401;
  }

  get isValidationError(): boolean {
    return this.statusCode === 422 || this.statusCode === 400;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed. Check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export function parseApiError(error: any): ApiError | NetworkError {
  if (error?.response) {
    const { status, data } = error.response;
    const message = data?.message || data?.errorMessage || data?.error || 'Something went wrong';
    return new ApiError(message, status, data);
  }
  if (error?.request) {
    return new NetworkError();
  }
  return new NetworkError(error?.message || 'An unexpected error occurred');
}
