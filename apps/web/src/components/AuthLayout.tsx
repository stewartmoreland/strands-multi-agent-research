import { Card, CardContent, CardHeader } from '@repo/ui'
import { Waves } from './Waves'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-950 p-4 md:p-8">
      <Waves />
      <Card className="relative z-10 w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-6 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <img src="/typescript.svg" alt="TypeScript" className="h-14 w-14" />
            <div className="flex flex-col items-start align-bottom">
              <span className="text-2xl font-semibold">Strands Agents</span>
              <span className="text-sm text-muted-foreground">Multi-Agent Research Demo</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  )
}
