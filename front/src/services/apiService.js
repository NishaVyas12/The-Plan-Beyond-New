import axios from 'axios';

const apiService = {
  get: async (url) => {
    try {
      const response = await axios.get(url, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  put: async (url, data) => {
    try {
      const response = await axios.put(url, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export { apiService };