import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../../utils/apiClient'

const messageFor = (error) =>
  error.response?.status === 404
    ? 'This API route is unavailable. Restart the backend server, then try again.'
    : error.response?.data?.message || 'Check the backend connection and try again.'

const useAdminData = (path, initialValue) => {
  const [data, setData] = useState(initialValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(
    async (signal) => {
      await Promise.resolve()
      if (signal?.aborted) return
      setLoading(true)
      setError('')
      try {
        const response = await apiClient.get(path, { signal })
        setData(response.data)
      } catch (failure) {
        if (failure.code === 'ERR_CANCELED') return
        setError(messageFor(failure))
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [path]
  )
  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => load(controller.signal))
    return () => controller.abort()
  }, [load])
  return { data, setData, loading, error, retry: () => load() }
}

export default useAdminData
