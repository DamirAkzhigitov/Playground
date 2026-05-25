import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function SignInPrompt() {
  const location = useLocation()
  const returnUrl = encodeURIComponent(location.pathname + location.search)

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm">
          Sign in to save your guide progress across devices.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to={`/login?returnUrl=${returnUrl}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/register?returnUrl=${returnUrl}`}>Create account</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
