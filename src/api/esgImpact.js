import { authApi } from './axios'

export async function getMyEsgImpact(targetMonth) {
  const response = await authApi.get('/esg-impact/me', {
    params: { targetMonth },
  })

  return response.data
}
