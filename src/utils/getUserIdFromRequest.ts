import { RequestWithAuthenticationHeader } from '../types/RequestWithAuthenticationHeader'
import jwt from './jwt'

export function getUserIdFromRequest(
  req: RequestWithAuthenticationHeader
): number | null {
  const token = req?.headers?.authorization?.split(' ')[1]
  if (token) {
    console.log(`about to get userId`)
    const userId = jwt.getUserId(token)
    console.log(userId)
    return userId
  }
  return null
}
