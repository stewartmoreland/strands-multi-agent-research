import md5 from 'md5'

/**
 * Returns the Gravatar URL for an email address.
 * Uses identicon as default when no Gravatar is set.
 */
export function getGravatarUrl(email: string, size = 80): string {
  const hash = md5(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=${size}`
}
