import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful authentication, redirect to the intended page
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Something went wrong, redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
}
