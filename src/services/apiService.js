import authService from './authService';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'http://localhost:9090' : '';

class ApiService {
  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle unauthorized responses
      if (response.status === 401) {
        authService.logout();
        window.location.href = '/';
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.apiCall(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.apiCall(endpoint, { method: 'DELETE' });
  }

  // Inventory API calls
  async getProducts() {
    return this.get('/api/inventory/products');
  }

  async addProduct(product) {
    return this.post('/api/inventory/products', product);
  }

  async updateProduct(id, product) {
    return this.put(`/api/inventory/products/${id}`, product);
  }

  async deleteProduct(id) {
    return this.delete(`/api/inventory/products/${id}`);
  }

  // Customer API calls
  async getCustomers() {
    return this.get('/api/customers');
  }

  async addCustomer(customer) {
    return this.post('/api/customers', customer);
  }

  async getCustomerProfile(id) {
    return this.get(`/api/customers/${id}`);
  }

  // Sales API calls
  async createInvoice(invoice) {
    return this.post('/api/sales/invoices', invoice);
  }

  async getInvoices() {
    return this.get('/api/sales/invoices');
  }

  // Reports API calls
  async getSalesReport(date) {
    return this.get(`/api/reports/sales?date=${date}`);
  }

  async getCostReport(date) {
    return this.get(`/api/reports/costs?date=${date}`);
  }

  async getInventoryReport() {
    return this.get('/api/reports/inventory');
  }

  async getReceivableReport() {
    return this.get('/api/reports/receivable');
  }

  // User management API calls
  async getUsers() {
    return this.get('/api/users');
  }

  async addUser(user) {
    return this.post('/api/users', user);
  }

  async updateUser(id, user) {
    return this.put(`/api/users/${id}`, user);
  }

  async deleteUser(id) {
    return this.delete(`/api/users/${id}`);
  }
}

const apiService = new ApiService();
export default apiService;
