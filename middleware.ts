import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let session = null
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Middleware: getSession error', error.message)
      // If refresh token error, clear cookies and continue as unauthenticated
      if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
        // Clear auth cookies
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        // Clear all Supabase auth cookies
        const cookieNames = request.cookies.getAll().map(c => c.name)
        cookieNames.forEach(name => {
          if (name.startsWith('sb-')) {
            response.cookies.delete(name)
          }
        })
      }
    } else {
      session = data.session
    }
  } catch (err) {
    console.error('Middleware: auth error', err)
    // On any auth error, continue as unauthenticated
  }

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/search', '/auth/callback', '/login', '/signup', '/auth/confirm']

  // Check if current path is public
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/law-firms/') || // Public law firm profile pages
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Static files

  // Onboarding routes
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  // If no session and trying to access protected route
  if (!session && !isPublicRoute && !isOnboardingRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'required')
    return NextResponse.redirect(url)
  }

  // If logged in and not on onboarding or public routes, check onboarding status
  if (session && !isOnboardingRoute && !isPublicRoute) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

      // If profile exists and onboarding not completed, redirect to onboarding
      if (profile && profile.onboarding_completed === false) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    } catch {
      // Profile doesn't exist yet, redirect to onboarding
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
