import api, { unwrapResponse } from './api';

export const usersService = {
  async getMe() {
    const res = await api.get('/users/me');
    return unwrapResponse(res);
  },

  async updateProfile(data: any) {
    // Uses PATCH /users/ which updates the current authenticated user via JWT
    const res = await api.patch('/users', data);
    return unwrapResponse(res);
  },

  async getPresignedUrl(filename: string, contentType: string) {
    const res = await api.get('/users/file/presigned-url', {
      params: { filename, content_type: contentType },
    });
    return unwrapResponse(res);
  },
};
