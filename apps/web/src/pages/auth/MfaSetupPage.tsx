import { Button } from '@repo/ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp'
import { Check, Copy, Loader2, Shield } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { useAuth } from '../../contexts/AuthContext'

export function MfaSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setupTOTP, verifyTOTP, setMfaPreference, isAuthenticated, user } = useAuth()

  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [copied, setCopied] = useState(false)

  const email = user?.email || (location.state as { email?: string })?.email || 'user'

  // Generate the otpauth URL for QR code
  const otpauthUrl = secret
    ? `otpauth://totp/AI%20Assistant:${encodeURIComponent(email)}?secret=${secret}&issuer=AI%20Assistant`
    : ''

  // Fetch TOTP secret on mount
  useEffect(() => {
    const fetchSecret = async () => {
      try {
        const secretCode = await setupTOTP()
        setSecret(secretCode)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to set up MFA'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if user is authenticated or coming from sign-in flow
    if (isAuthenticated || location.state) {
      fetchSecret()
    } else {
      navigate('/auth/sign-in')
    }
  }, [setupTOTP, isAuthenticated, navigate, location.state])

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = secret
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setIsVerifying(true)

    try {
      await verifyTOTP(code, 'Authenticator App')
      await setMfaPreference(true)
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed'

      if (message.includes('EnableSoftwareTokenMFAException') || message.includes('Code mismatch')) {
        setError('Invalid code. Please try again.')
      } else {
        setError(message)
      }
      setCode('')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSkip = () => {
    navigate('/', { replace: true })
  }

  if (isLoading) {
    return (
      <AuthLayout title="Setting up MFA" description="Please wait...">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set up two-factor authentication" description="Add an extra layer of security to your account">
      <div className="flex justify-center mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
      </div>

      <div className="space-y-6">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {/* Step 1: QR Code */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">1. Scan this QR code</h3>
          <p className="text-xs text-muted-foreground">
            Use an authenticator app like Google Authenticator, Authy, or 1Password
          </p>
          <div className="flex justify-center p-4 bg-white rounded-lg">
            {otpauthUrl && <QRCodeSVG value={otpauthUrl} size={180} level="M" includeMargin={false} />}
          </div>
        </div>

        {/* Step 2: Manual entry */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Or enter code manually</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">{secret}</code>
            <Button type="button" variant="outline" size="icon" onClick={handleCopySecret} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Step 3: Verify */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">2. Enter verification code</h3>
            <p className="text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
          </div>

          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={isVerifying}>
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

          <Button type="submit" className="w-full" disabled={isVerifying || code.length !== 6}>
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enable Two-Factor Authentication
          </Button>
        </form>

        {/* Skip option (only if MFA is optional) */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
