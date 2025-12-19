'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LawFirm } from '@/types'

export function useLawFirms() {
  const [lawFirms, setLawFirms] = useState<LawFirm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchLawFirms() {
      console.log('useLawFirms: starting fetch')

      try {
        const supabase = createClient()
        console.log('useLawFirms: executing query...')

        const { data, error } = await supabase
          .from('law_firms')
          .select(`
            id,
            name,
            slug,
            email,
            phone,
            logo_url,
            description,
            office_locations (
              id,
              name,
              street_address,
              city,
              state,
              zip_code,
              latitude,
              longitude,
              is_primary
            )
          `)
          .eq('status', 'active')
          .order('name')

        console.log('useLawFirms: query complete', { data, error })

        if (error) {
          console.error('useLawFirms: Supabase error', error)
          setError(error.message)
        } else {
          console.log('useLawFirms: setting', data?.length, 'firms')
          setLawFirms((data as LawFirm[]) || [])
        }
      } catch (err) {
        console.error('useLawFirms: caught exception', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch law firms')
      } finally {
        setLoading(false)
      }
    }

    fetchLawFirms()

    return () => {
      controller.abort()
    }
  }, [])

  return { lawFirms, loading, error }
}
