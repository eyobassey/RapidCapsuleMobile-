import {ApiError, NetworkError, parseApiError} from '../api-error';

describe('ApiError', () => {
  it('sets message, statusCode, and data', () => {
    const error = new ApiError('Bad request', 400, {field: 'email'});

    expect(error.message).toBe('Bad request');
    expect(error.statusCode).toBe(400);
    expect(error.data).toEqual({field: 'email'});
    expect(error.name).toBe('ApiError');
    expect(error).toBeInstanceOf(Error);
  });

  it('isAuthError returns true for 401', () => {
    const error = new ApiError('Unauthorized', 401);
    expect(error.isAuthError).toBe(true);
  });

  it('isAuthError returns false for non-401', () => {
    const error = new ApiError('Forbidden', 403);
    expect(error.isAuthError).toBe(false);
  });

  it('isValidationError returns true for 400', () => {
    const error = new ApiError('Bad request', 400);
    expect(error.isValidationError).toBe(true);
  });

  it('isValidationError returns true for 422', () => {
    const error = new ApiError('Unprocessable', 422);
    expect(error.isValidationError).toBe(true);
  });

  it('isValidationError returns false for non-400/422', () => {
    const error = new ApiError('Not found', 404);
    expect(error.isValidationError).toBe(false);
  });

  it('isServerError returns true for 500', () => {
    const error = new ApiError('Internal error', 500);
    expect(error.isServerError).toBe(true);
  });

  it('isServerError returns true for 503', () => {
    const error = new ApiError('Service unavailable', 503);
    expect(error.isServerError).toBe(true);
  });

  it('isServerError returns false for 4xx', () => {
    const error = new ApiError('Not found', 404);
    expect(error.isServerError).toBe(false);
  });

  it('isNotFound returns true for 404', () => {
    const error = new ApiError('Not found', 404);
    expect(error.isNotFound).toBe(true);
  });

  it('isNotFound returns false for non-404', () => {
    const error = new ApiError('Bad request', 400);
    expect(error.isNotFound).toBe(false);
  });
});

describe('NetworkError', () => {
  it('uses default message', () => {
    const error = new NetworkError();
    expect(error.message).toBe(
      'Network request failed. Check your connection.',
    );
    expect(error.name).toBe('NetworkError');
    expect(error).toBeInstanceOf(Error);
  });

  it('uses custom message', () => {
    const error = new NetworkError('Custom network error');
    expect(error.message).toBe('Custom network error');
  });
});

describe('parseApiError', () => {
  it('returns ApiError when response exists with data.message', () => {
    const axiosError = {
      response: {
        status: 400,
        data: {message: 'Validation failed'},
      },
    };

    const result = parseApiError(axiosError);

    expect(result).toBeInstanceOf(ApiError);
    expect((result as ApiError).message).toBe('Validation failed');
    expect((result as ApiError).statusCode).toBe(400);
  });

  it('returns ApiError with data.error fallback', () => {
    const axiosError = {
      response: {
        status: 500,
        data: {error: 'Server broke'},
      },
    };

    const result = parseApiError(axiosError);

    expect(result).toBeInstanceOf(ApiError);
    expect((result as ApiError).message).toBe('Server broke');
  });

  it('returns ApiError with default message when no message/error', () => {
    const axiosError = {
      response: {
        status: 500,
        data: {},
      },
    };

    const result = parseApiError(axiosError);

    expect(result).toBeInstanceOf(ApiError);
    expect((result as ApiError).message).toBe('Something went wrong');
  });

  it('returns NetworkError when only request exists (no response)', () => {
    const axiosError = {
      request: {},
    };

    const result = parseApiError(axiosError);

    expect(result).toBeInstanceOf(NetworkError);
    expect(result.message).toBe(
      'Network request failed. Check your connection.',
    );
  });

  it('returns NetworkError with error message for unknown errors', () => {
    const result = parseApiError({message: 'timeout exceeded'});

    expect(result).toBeInstanceOf(NetworkError);
    expect(result.message).toBe('timeout exceeded');
  });

  it('returns NetworkError with default for completely unknown errors', () => {
    const result = parseApiError({});

    expect(result).toBeInstanceOf(NetworkError);
    expect(result.message).toBe('An unexpected error occurred');
  });

  it('returns NetworkError for null/undefined', () => {
    const result = parseApiError(null);

    expect(result).toBeInstanceOf(NetworkError);
  });
});
