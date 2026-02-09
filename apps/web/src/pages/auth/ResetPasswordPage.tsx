import { Button, Input } from '@repo/ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp'
import { Label } from '@repo/ui/components/label'
import { ArrowLeft, Check, KeyRound, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { useAuth } from '../../contexts/AuthContext'

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  {
    label: 'One special character',
    test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
]

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { confirmPassword, forgotPassword } = useAuth()

  const emailFromState = (location.state as { email?: string })?.email || ''
  const [email, setEmail] = useState(emailFromState)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showRequirements, setShowRequirements] = useState(false)

  const passwordsMatch = newPassword === confirmNewPassword
  const allRequirementsMet = passwordRequirements.every((req) => req.test(newPassword))

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

    if (!allRequirementsMet) {
      setError('Password does not meet all requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await confirmPassword(email, code, newPassword)
      navigate('/auth/sign-in', {
        state: { message: 'Password reset successful! You can now sign in.' },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed'

      if (message.includes('CodeMismatchException')) {
        setError('Invalid reset code. Please try again.')
      } else if (message.includes('ExpiredCodeException')) {
        setError('Reset code has expired. Please request a new one.')
      } else if (message.includes('InvalidPasswordException')) {
        setError('Password does not meet requirements')
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setError('')
    setIsResending(true)

    try {
      await forgotPassword(email)
      setResendCooldown(60)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code'
      if (message.includes('LimitExceededException')) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError(message)
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout title="Reset password" description="Enter the code sent to your email and choose a new password">
      <div className="flex justify-center mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {!emailFromState && (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
        )}

        {emailFromState && (
          <p className="text-center text-sm text-muted-foreground">
            Code sent to <span className="font-medium text-foreground">{email}</span>
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">Reset Code</Label>
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

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setShowRequirements(true)}
            required
            autoComplete="new-password"
            disabled={isLoading}
          />
          {showRequirements && newPassword && (
            <div className="rounded-md bg-muted p-3 space-y-1.5 text-xs">
              {passwordRequirements.map((req) => {
                const met = req.test(newPassword)
                return (
                  <div
                    key={req.label}
                    className={`flex items-center gap-2 ${
                      met ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'
                    }`}
                  >
                    {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>{req.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
          <Input
            id="confirmNewPassword"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={isLoading}
            className={confirmNewPassword && !passwordsMatch ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {confirmNewPassword && !passwordsMatch && <p className="text-xs text-destructive">Passwords do not match</p>}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || code.length !== 6 || !allRequirementsMet || !passwordsMatch}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset Password
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
              disabled={isResending || !email}
              className="text-primary underline-offset-4 hover:underline font-medium disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          )}
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
