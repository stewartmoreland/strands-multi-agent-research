import { Button, Card, Input } from '@repo/ui'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog'
import { Label } from '@repo/ui/components/label'
import { ArrowLeft, Check, KeyRound, Loader2, Trash2, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { getGravatarUrl } from '../lib/gravatar'

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

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateUserAttributes, changePassword, deleteUser } = useAuth()

  const [preferredUsername, setPreferredUsername] = useState(user?.preferredUsername ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [givenName, setGivenName] = useState(user?.givenName ?? '')
  const [familyName, setFamilyName] = useState(user?.familyName ?? '')
  const [picture, setPicture] = useState(user?.picture ?? '')
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.picture ?? '')

  const [attributesSaving, setAttributesSaving] = useState(false)
  const [attributesError, setAttributesError] = useState('')
  const [attributesSuccess, setAttributesSuccess] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (user) {
      setPreferredUsername(user.preferredUsername ?? '')
      setEmail(user.email ?? '')
      setGivenName(user.givenName ?? '')
      setFamilyName(user.familyName ?? '')
      setPicture(user.picture ?? '')
      setAvatarUrlInput(user.picture ?? '')
    }
  }, [user])

  const passwordsMatch = newPassword === confirmNewPassword
  const allRequirementsMet = Boolean(newPassword) && passwordRequirements.every((req) => req.test(newPassword))

  const avatarSrc = picture ? picture : user?.email ? getGravatarUrl(user.email, 96) : ''

  const handleSaveAttributes = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAttributesError('')
    setAttributesSuccess(false)
    setAttributesSaving(true)
    try {
      const attrs: Record<string, string> = {}
      if (preferredUsername !== (user?.preferredUsername ?? '')) attrs.preferred_username = preferredUsername
      if (email !== (user?.email ?? '')) attrs.email = email
      if (givenName !== (user?.givenName ?? '')) attrs.given_name = givenName
      if (familyName !== (user?.familyName ?? '')) attrs.family_name = familyName
      if (avatarUrlInput !== (user?.picture ?? '')) attrs.picture = avatarUrlInput
      if (Object.keys(attrs).length > 0) {
        await updateUserAttributes(attrs)
        setPicture(avatarUrlInput)
        setAttributesSuccess(true)
      }
    } catch (err) {
      setAttributesError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setAttributesSaving(false)
    }
  }

  const handleUseGravatar = () => {
    setAvatarUrlInput('')
    setPicture('')
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)
    if (!allRequirementsMet || !passwordsMatch) return
    setPasswordLoading(true)
    try {
      await changePassword(oldPassword, newPassword)
      setPasswordSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')
    setDeleteLoading(true)
    try {
      await deleteUser()
      navigate('/auth/sign-in', { replace: true })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8 px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight mb-8">Profile</h1>

        {/* Avatar & attributes */}
        <Card className="p-6 mb-6">
          <form onSubmit={handleSaveAttributes} className="space-y-6">
            {attributesError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{attributesError}</div>
            )}
            {attributesSuccess && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                Profile updated.
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex flex-col items-center gap-2">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="h-24 w-24 rounded-full object-cover border" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={handleUseGravatar}>
                  Use Gravatar
                </Button>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://..."
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                    disabled={attributesSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredUsername">Display name</Label>
                  <Input
                    id="preferredUsername"
                    value={preferredUsername}
                    onChange={(e) => setPreferredUsername(e.target.value)}
                    placeholder="Preferred username"
                    disabled={attributesSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={attributesSaving}
                  />
                  {user.emailVerified && <p className="text-xs text-muted-foreground">Verified</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="givenName">First name</Label>
                    <Input
                      id="givenName"
                      value={givenName}
                      onChange={(e) => setGivenName(e.target.value)}
                      disabled={attributesSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Last name</Label>
                    <Input
                      id="familyName"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      disabled={attributesSaving}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={attributesSaving}>
              {attributesSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save profile
            </Button>
          </form>
        </Card>

        {/* Change password */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Change password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                Password updated.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current password</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                disabled={passwordLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                autoComplete="new-password"
                disabled={passwordLoading}
              />
              {showPasswordRequirements && newPassword && (
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
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={passwordLoading}
                className={
                  confirmNewPassword && !passwordsMatch ? 'border-destructive focus-visible:ring-destructive' : ''
                }
              />
              {confirmNewPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={passwordLoading || !oldPassword || !newPassword || !passwordsMatch || !allRequirementsMet}
            >
              {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change password
            </Button>
          </form>
        </Card>

        {/* Delete account */}
        <Card className="p-6 border-destructive/50">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-medium text-destructive">Delete account</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            Delete account
          </Button>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account. You will no longer be able to sign in. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{deleteError}</div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
