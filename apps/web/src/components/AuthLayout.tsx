import { Card, CardContent, CardHeader } from "@repo/ui";
import { Sparkles } from "lucide-react";
import { Waves } from "./Waves";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-950 p-4 md:p-8">
      <Waves />
      <Card className="relative z-10 w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-6 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">AI Assistant</span>
          </div>
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  );
}
