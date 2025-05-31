import { API_URL } from '../utils/constants';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP error! status: ${response.status}` 
      }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getTerms(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/terms?${queryParams}`);
  }

  async addTerm(data) {
    return this.request('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTerm(id, data) {
    return this.request(`/terms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTerm(id) {
    return this.request(`/terms/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories() {
    return this.request('/categories');
  }
}

export const apiService = new ApiService();