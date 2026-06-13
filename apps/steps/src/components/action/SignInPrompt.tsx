import { buildAuthLoginUrl, buildAuthRegisterUrl } from '@playground/auth-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function SignInPrompt() {
  const returnUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : 'https://steps.da-mr.com'
  const loginUrl = buildAuthLoginUrl(returnUrl)
  const registerUrl = buildAuthRegisterUrl(returnUrl)

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm">
          Sign in to save your guide progress across devices.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a href={loginUrl}>Sign in</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={registerUrl}>Create account</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
