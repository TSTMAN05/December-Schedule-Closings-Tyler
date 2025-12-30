import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LawFirmStats {
  transactions: {
    total: number
    last7Days: number
  }
  staff: {
    total: number
    active: number
    inactive: number
  }
  followers: {
    total: number
    last7Days: number
  }
  reviews: {
    total: number
    last7Days: number
    averageRating: number
  }
}

export function useLawFirmStats(lawFirmId: string | null) {
  const [stats, setStats] = useState<LawFirmStats>({
    transactions: { total: 0, last7Days: 0 },
    staff: { total: 0, active: 0, inactive: 0 },
    followers: { total: 0, last7Days: 0 },
    reviews: { total: 0, last7Days: 0, averageRating: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lawFirmId) {
      setLoading(false)
      return
    }

    async function fetchStats() {
      const supabase = createClient()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoISO = sevenDaysAgo.toISOString()

      // Fetch all stats in parallel
      const [
        ordersTotal,
        ordersLast7,
        staffTotal,
        staffActive,
        staffInactive,
        followersTotal,
        followersLast7,
        reviewsTotal,
        reviewsLast7,
        reviewsWithRating,
      ] = await Promise.all([
        // Transactions
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId)
          .gte('created_at', sevenDaysAgoISO),

        // Staff
        supabase
          .from('attorneys')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId),
        supabase
          .from('attorneys')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId)
          .eq('is_active', true),
        supabase
          .from('attorneys')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId)
          .eq('is_active', false),

        // Followers - these tables may not exist yet, so we handle errors gracefully
        supabase
          .from('law_firm_followers')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId),
        supabase
          .from('law_firm_followers')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId)
          .gte('created_at', sevenDaysAgoISO),

        // Reviews - these tables may not exist yet, so we handle errors gracefully
        supabase
          .from('law_firm_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId)
          .eq('is_published', true),
        supabase
          .from('law_firm_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('law_firm_id', lawFirmId)
          .eq('is_published', true)
          .gte('created_at', sevenDaysAgoISO),
        supabase
          .from('law_firm_reviews')
          .select('rating')
          .eq('law_firm_id', lawFirmId)
          .eq('is_published', true),
      ])

      // Calculate average rating
      let averageRating = 0
      if (reviewsWithRating.data && reviewsWithRating.data.length > 0) {
        const sum = reviewsWithRating.data.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0)
        averageRating = Math.round((sum / reviewsWithRating.data.length) * 10) / 10
      }

      setStats({
        transactions: {
          total: ordersTotal.count || 0,
          last7Days: ordersLast7.count || 0,
        },
        staff: {
          total: staffTotal.count || 0,
          active: staffActive.count || 0,
          inactive: staffInactive.count || 0,
        },
        followers: {
          // Handle case where table doesn't exist yet
          total: followersTotal.error ? 0 : (followersTotal.count || 0),
          last7Days: followersLast7.error ? 0 : (followersLast7.count || 0),
        },
        reviews: {
          // Handle case where table doesn't exist yet
          total: reviewsTotal.error ? 0 : (reviewsTotal.count || 0),
          last7Days: reviewsLast7.error ? 0 : (reviewsLast7.count || 0),
          averageRating,
        },
      })

      setLoading(false)
    }

    fetchStats()

    // Set up real-time subscriptions
    const supabase = createClient()

    const ordersChannel = supabase
      .channel('stats-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `law_firm_id=eq.${lawFirmId}`
      }, () => fetchStats())
      .subscribe()

    const attorneysChannel = supabase
      .channel('stats-attorneys')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attorneys',
        filter: `law_firm_id=eq.${lawFirmId}`
      }, () => fetchStats())
      .subscribe()

    const followersChannel = supabase
      .channel('stats-followers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'law_firm_followers',
        filter: `law_firm_id=eq.${lawFirmId}`
      }, () => fetchStats())
      .subscribe()

    const reviewsChannel = supabase
      .channel('stats-reviews')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'law_firm_reviews',
        filter: `law_firm_id=eq.${lawFirmId}`
      }, () => fetchStats())
      .subscribe()

    return () => {
      ordersChannel.unsubscribe()
      attorneysChannel.unsubscribe()
      followersChannel.unsubscribe()
      reviewsChannel.unsubscribe()
    }
  }, [lawFirmId])

  return { stats, loading }
}
