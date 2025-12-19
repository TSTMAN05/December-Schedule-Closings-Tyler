'use client'

import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) {
    console.log('Supabase: returning cached client')
    return client
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('Supabase: creating new client', {
    hasUrl: !!url,
    hasKey: !!key,
    url: url?.substring(0, 30) + '...',
  })

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  client = createBrowserClient(url, key)
  console.log('Supabase: client created successfully')

  return client
}
