import api from './api';

export const usersService = {
  async getMe() {
    const res = await api.get('/users/me');
    return res.data.data || res.data.result;
  },

  async updateProfile(userId: string, data: any) {
    const res = await api.patch(`/users/${userId}`, data);
    return res.data.data || res.data.result;
  },
};
