import { apiClient } from '../../utils/apiClient'

const productApi = {
  get: (path, config) => apiClient.get(`/products${path === '/' ? '' : path}`, config),
  post: (path, data, config) =>
    apiClient.post(`/products${path === '/' ? '' : path}`, data, config),
  put: (path, data, config) => apiClient.put(`/products${path}`, data, config),
  delete: (path, config) => apiClient.delete(`/products${path}`, config)
}

export default productApi
