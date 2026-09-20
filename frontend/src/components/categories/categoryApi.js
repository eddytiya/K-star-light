import { apiClient } from '../../utils/apiClient'

const categoryApi = {
  get: (path, config) => apiClient.get(`/categories${path === '/' ? '' : path}`, config),
  post: (path, data, config) => apiClient.post(`/categories${path === '/' ? '' : path}`, data, config),
  put: (path, data, config) => apiClient.put(`/categories${path}`, data, config),
  delete: (path, config) => apiClient.delete(`/categories${path}`, config)
}

export default categoryApi
