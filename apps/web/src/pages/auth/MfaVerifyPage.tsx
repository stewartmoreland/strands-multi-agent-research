import { Button } from '@repo/ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp'
import { Label } from '@repo/ui/components/label'
import { ArrowLeft, Loader2, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { useAuth } from '../../contexts/AuthContext'

export function MfaVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { respondToMfaChallenge, mfaChallenge, isAuthenticated } = useAuth()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const email = mfaChallenge.email || (location.state as { email?: string })?.email

  // Redirect if no MFA challenge or already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    } else if (!mfaChallenge.required && !email) {
      navigate('/auth/sign-in')
    }
  }, [isAuthenticated, mfaChallenge.required, email, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setIsLoading(true)

    try {
      await respondToMfaChallenge(code)
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed'

      if (message.includes('CodeMismatchException') || message.includes('Invalid code')) {
        setError('Invalid code. Please try again.')
      } else if (message.includes('ExpiredCodeException')) {
        setError('Session expired. Please sign in again.')
        setTimeout(() => navigate('/auth/sign-in'), 2000)
      } else {
        setError(message)
      }
      setCode('')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6 && !isLoading) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent)
    }
  }, [code])

  return (
    <AuthLayout title="Two-factor authentication" description="Enter the code from your authenticator app">
      <div className="flex justify-center mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
      </div>

      {email && (
        <p className="text-center text-sm text-muted-foreground mb-6">
          Signing in as <span className="font-medium text-foreground">{email}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="code" className="sr-only">
            Authentication Code
          </Label>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={isLoading} autoFocus>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Open your authenticator app to view your code
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>
      </form>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Having trouble?</span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          If you've lost access to your authenticator app, contact support to recover your account.
        </p>
      </div>

      <Link
        to="/auth/sign-in"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
