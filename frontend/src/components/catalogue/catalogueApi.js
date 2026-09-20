import { apiClient } from '../../utils/apiClient'

const catalogueApi = {
  get: (path, config) => apiClient.get(`/catalogue${path === '/' ? '' : path}`, config)
}

export default catalogueApi
