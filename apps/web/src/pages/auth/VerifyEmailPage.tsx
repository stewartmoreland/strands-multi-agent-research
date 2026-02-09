import { Button } from '@repo/ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp'
import { Label } from '@repo/ui/components/label'
import { Loader2, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { useAuth } from '../../contexts/AuthContext'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { confirmSignUp, resendConfirmationCode } = useAuth()

  const emailFromState = (location.state as { email?: string })?.email || ''
  const [email] = useState(emailFromState)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/auth/sign-up')
    }
  }, [email, navigate])

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setIsLoading(true)

    try {
      await confirmSignUp(email, code)
      navigate('/auth/sign-in', {
        state: { message: 'Email verified! You can now sign in.' },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed'

      if (message.includes('CodeMismatchException')) {
        setError('Invalid verification code. Please try again.')
      } else if (message.includes('ExpiredCodeException')) {
        setError('Verification code has expired. Please request a new one.')
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setIsResending(true)

    try {
      await resendConfirmationCode(email)
      setResendCooldown(60) // 60 second cooldown
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code'
      setError(message)
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <AuthLayout title="Verify your email" description="We sent a verification code to your email">
      <div className="flex justify-center mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mb-6">
        Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="code" className="sr-only">
            Verification Code
          </Label>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={isLoading}>
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
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Email
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          {resendCooldown > 0 ? (
            <span className="text-muted-foreground">Resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-primary underline-offset-4 hover:underline font-medium disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/auth/sign-up" className="text-primary underline-offset-4 hover:underline font-medium">
          Use a different email
        </Link>
      </p>
    </AuthLayout>
  )
}
