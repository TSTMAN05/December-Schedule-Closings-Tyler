import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has a profile and onboarding status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed, profile_type, role')
        .eq('id', data.user.id)
        .single()

      // If no profile exists, create one for onboarding
      // Note: The database trigger should create this, but handle edge cases
      if (profileError?.code === 'PGRST116' || !profile) {
        // Profile doesn't exist - create a minimal one for onboarding
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          onboarding_completed: false,
          onboarding_step: 1,
        })
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // If onboarding not completed, redirect to onboarding
      if (!profile.onboarding_completed) {
        // Check which step they're on and redirect appropriately
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // If they have a specific redirectTo and it's not the default, use it
      if (redirectTo && redirectTo !== '/') {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }

      // Otherwise redirect based on profile_type (from onboarding) or role
      const userType = profile.profile_type || profile.role
      if (userType === 'law_firm' || userType === 'title_company' ||
          userType === 'title_search' || userType === 'title_insurance' ||
          userType === 'notary') {
        return NextResponse.redirect(`${origin}/law-firm`)
      } else if (userType === 'attorney') {
        return NextResponse.redirect(`${origin}/attorney`)
      } else if (userType === 'admin') {
        return NextResponse.redirect(`${origin}/admin`)
      } else {
        return NextResponse.redirect(`${origin}/search`)
      }
    }
  }

  // Something went wrong, redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
}
