import type { CognitoUserSession } from 'amazon-cognito-identity-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as cognito from '../lib/cognito'

export interface User {
  email: string
  emailVerified: boolean
  sub: string
  givenName?: string
  familyName?: string
  preferredUsername?: string
  picture?: string
}

export interface AuthState {
  user: User | null
  session: CognitoUserSession | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface MfaChallengeState {
  required: boolean
  setupRequired: boolean
  email?: string
}

export interface AuthContextValue extends AuthState {
  // Authentication actions
  signUp: (
    email: string,
    password: string,
    givenName?: string,
    familyName?: string,
  ) => Promise<{ userConfirmed: boolean }>
  confirmSignUp: (email: string, code: string) => Promise<void>
  resendConfirmationCode: (email: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<{ mfaRequired: boolean; totpSetupRequired: boolean }>
  signOut: () => Promise<void>

  // Password management
  forgotPassword: (email: string) => Promise<void>
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>

  // MFA management
  mfaChallenge: MfaChallengeState
  respondToMfaChallenge: (code: string) => Promise<void>
  setupTOTP: () => Promise<string>
  verifyTOTP: (code: string, deviceName?: string) => Promise<void>
  setMfaPreference: (enabled: boolean) => Promise<void>

  // Token access
  getIdToken: () => Promise<string | null>
  getAccessToken: () => Promise<string | null>

  // Session refresh
  refreshSession: () => Promise<void>

  // Profile management
  updateUserAttributes: (attributes: Partial<Record<string, string>>) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  deleteUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<CognitoUserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeState>({
    required: false,
    setupRequired: false,
  })

  const isAuthenticated = user !== null && session !== null && session.isValid()

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentSession = await cognito.getSession()
        if (currentSession && currentSession.isValid()) {
          setSession(currentSession)
          const attributes = await cognito.getUserAttributes()
          setUser({
            email: attributes.email || '',
            emailVerified: attributes.email_verified === 'true',
            sub: attributes.sub || '',
            givenName: attributes.given_name,
            familyName: attributes.family_name,
            preferredUsername: attributes.preferred_username,
            picture: attributes.picture,
          })
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        // Clear any stale state
        setUser(null)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const signUp = useCallback(async (email: string, password: string, givenName?: string, familyName?: string) => {
    const result = await cognito.signUp({
      email,
      password,
      givenName,
      familyName,
    })
    return { userConfirmed: result.userConfirmed }
  }, [])

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    await cognito.confirmSignUp(email, code)
  }, [])

  const resendConfirmationCode = useCallback(async (email: string) => {
    await cognito.resendConfirmationCode(email)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await cognito.signIn(email, password)

    if (result.mfaRequired) {
      setMfaChallenge({
        required: true,
        setupRequired: false,
        email,
      })
      return { mfaRequired: true, totpSetupRequired: false }
    }

    if (result.totpSetupRequired) {
      setMfaChallenge({
        required: false,
        setupRequired: true,
        email,
      })
      return { mfaRequired: false, totpSetupRequired: true }
    }

    if (result.success && result.session) {
      setSession(result.session)
      const attributes = await cognito.getUserAttributes()
      setUser({
        email: attributes.email || email,
        emailVerified: attributes.email_verified === 'true',
        sub: attributes.sub || '',
        givenName: attributes.given_name,
        familyName: attributes.family_name,
        preferredUsername: attributes.preferred_username,
        picture: attributes.picture,
      })
      setMfaChallenge({ required: false, setupRequired: false })
    }

    return { mfaRequired: false, totpSetupRequired: false }
  }, [])

  const respondToMfaChallenge = useCallback(
    async (code: string) => {
      const result = await cognito.respondToTotpChallenge(code)

      if (result.success && result.session) {
        setSession(result.session)
        const attributes = await cognito.getUserAttributes()
        setUser({
          email: attributes.email || mfaChallenge.email || '',
          emailVerified: attributes.email_verified === 'true',
          sub: attributes.sub || '',
          givenName: attributes.given_name,
          familyName: attributes.family_name,
          preferredUsername: attributes.preferred_username,
          picture: attributes.picture,
        })
        setMfaChallenge({ required: false, setupRequired: false })
      }
    },
    [mfaChallenge.email],
  )

  const signOutUser = useCallback(async () => {
    try {
      await cognito.globalSignOut()
    } catch {
      // Fall back to local sign out
      cognito.signOut()
    }
    setUser(null)
    setSession(null)
    setMfaChallenge({ required: false, setupRequired: false })
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    await cognito.forgotPassword(email)
  }, [])

  const confirmPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await cognito.confirmPassword(email, code, newPassword)
  }, [])

  const setupTOTP = useCallback(async () => {
    return cognito.setupTOTP()
  }, [])

  const verifyTOTP = useCallback(async (code: string, deviceName?: string) => {
    await cognito.verifyTOTP(code, deviceName)
    setMfaChallenge({ required: false, setupRequired: false })
  }, [])

  const setMfaPreference = useCallback(async (enabled: boolean) => {
    await cognito.setMfaPreference(enabled)
  }, [])

  const getIdToken = useCallback(async () => {
    return cognito.getIdToken()
  }, [])

  const getAccessToken = useCallback(async () => {
    return cognito.getAccessToken()
  }, [])

  const refreshSession = useCallback(async () => {
    const currentSession = await cognito.getSession()
    if (currentSession && currentSession.isValid()) {
      setSession(currentSession)
    } else {
      setUser(null)
      setSession(null)
    }
  }, [])

  const updateUserAttributes = useCallback(async (attributes: Partial<Record<string, string>>) => {
    if (Object.keys(attributes).length === 0) return
    await cognito.updateUserAttributes(attributes as Record<string, string>)
    const attrs = await cognito.getUserAttributes()
    setUser((prev) =>
      prev
        ? {
            ...prev,
            email: attrs.email ?? prev.email,
            emailVerified: attrs.email_verified === 'true',
            givenName: attrs.given_name ?? undefined,
            familyName: attrs.family_name ?? undefined,
            preferredUsername: attrs.preferred_username ?? undefined,
            picture: attrs.picture ?? undefined,
          }
        : null,
    )
  }, [])

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await cognito.changePassword(oldPassword, newPassword)
  }, [])

  const deleteUser = useCallback(async () => {
    await cognito.deleteUser()
    cognito.signOut()
    setUser(null)
    setSession(null)
    setMfaChallenge({ required: false, setupRequired: false })
  }, [])

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signIn,
    signOut: signOutUser,
    forgotPassword,
    confirmPassword,
    mfaChallenge,
    respondToMfaChallenge,
    setupTOTP,
    verifyTOTP,
    setMfaPreference,
    getIdToken,
    getAccessToken,
    refreshSession,
    updateUserAttributes,
    changePassword,
    deleteUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
