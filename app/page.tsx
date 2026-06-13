import { headers } from "next/headers"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { auth } from "@/lib/auth"

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-2xl font-medium">Welcome, {session?.user.name}</h1>
        <p className="text-muted-foreground">
          Signed in as {session?.user.email} ({session?.user.role})
        </p>
      </div>
      <SignOutButton />
    </div>
  )
}
