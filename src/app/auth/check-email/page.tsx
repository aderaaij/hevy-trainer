import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a confirmation link
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Click the link in your email to confirm your account and complete the setup. 
            The link will expire in 24 hours.
          </p>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </div>
          <Link href="/auth/signup">
            <Button variant="outline" className="w-full">
              Back to Sign Up
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}