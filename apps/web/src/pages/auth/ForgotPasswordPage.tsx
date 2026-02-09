import { Button, Input } from '@repo/ui'
import { Label } from '@repo/ui/components/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { useAuth } from '../../contexts/AuthContext'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await forgotPassword(email)
      navigate('/auth/reset-password', { state: { email } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset code'

      if (message.includes('UserNotFoundException')) {
        // For security, don't reveal if user exists
        navigate('/auth/reset-password', { state: { email } })
      } else if (message.includes('LimitExceededException')) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Forgot password?" description="Enter your email and we'll send you a reset code">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Reset Code
        </Button>
      </form>

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
