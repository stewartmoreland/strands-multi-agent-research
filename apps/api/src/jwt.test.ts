import { describe, expect, it } from 'vitest'
import { getActorIdFromToken } from './jwt'

describe('getActorIdFromToken', () => {
  it('returns null for empty token', () => {
    expect(getActorIdFromToken('')).toBeNull()
    expect(getActorIdFromToken('   ')).toBeNull()
  })

  it('returns null for malformed JWT (not 3 parts)', () => {
    expect(getActorIdFromToken('a.b')).toBeNull()
  })

  it('returns sub from valid JWT payload', () => {
    const payload = JSON.stringify({ sub: 'user-456' })
    const base64 = Buffer.from(payload, 'utf-8').toString('base64')
    const token = `header.${base64}.sig`
    expect(getActorIdFromToken(token)).toBe('user-456')
  })

  it('returns null when sub is not a string', () => {
    const payload = JSON.stringify({ sub: 123 })
    const base64 = Buffer.from(payload, 'utf-8').toString('base64')
    const token = `header.${base64}.sig`
    expect(getActorIdFromToken(token)).toBeNull()
  })
})
