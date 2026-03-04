import api from './api';

export const usersService = {
  async getMe() {
    const res = await api.get('/users/me');
    return res.data.data || res.data.result;
  },

  async updateProfile(data: any) {
    // Uses PATCH /users/ which updates the current authenticated user via JWT
    const res = await api.patch('/users', data);
    return res.data.data || res.data.result;
  },
};
