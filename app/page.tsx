'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import Layout from '@/components/Layout'
import FortuneDisplay from '@/components/FortuneDisplay'
import Button from '@/components/Button'
import styles from '@/styles/Home.module.css'

interface Track {
  name: string
  artistName: string
  spotifyUrl: string
  previewUrl: string | null
}

interface Fortune {
  text: string
  tracks: Track[]
}

interface StoredFortune {
  fortune: Fortune
  date: string // Store date as YYYY-MM-DD
}

// Helper to get current date as YYYY-MM-DD string
const getTodayDateString = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export default function Home() {
  const { data: session } = useSession()
  const [fortune, setFortune] = useState<Fortune | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canFetchNewFortune, setCanFetchNewFortune] = useState(true)
  const initialLoadRef = useRef(true)

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })

  const calculateTimeUntilMidnight = () => {
    const now = new Date()
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Next day's midnight
      0, 0, 0 // at 00:00:00
    )
    const diff = midnight.getTime() - now.getTime()

    if (diff <= 0) { // Should not happen if logic is correct, but as a fallback
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      setCanFetchNewFortune(true) // Midnight has passed
      return
    }

    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / 1000 / 60) % 60)
    const seconds = Math.floor((diff / 1000) % 60)
    setTimeLeft({ hours, minutes, seconds })
  }

  const getFortune = async (isManualRequest = false) => {
    if (!session) return

    const todayString = getTodayDateString()
    const storedFortuneData = localStorage.getItem('spotifyFortuneCookie')

    if (!isManualRequest && storedFortuneData) {
      try {
        const parsedData: StoredFortune = JSON.parse(storedFortuneData)
        if (parsedData.date === todayString && parsedData.fortune) {
          setFortune(parsedData.fortune)
          setCanFetchNewFortune(false)
          setError(null)
          setLoading(false)
          return
        }
      } catch (e) {
        console.error("Error parsing stored fortune:", e)
        localStorage.removeItem('spotifyFortuneCookie')
      }
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/fortune')
      const data = await response.json()
      
      if (response.status === 403) {
        setError('Need additional permissions. Please sign out and sign in again.')
        setFortune(null) 
        return
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get fortune')
      }
      
      if (data.fortune) {
        setFortune(data.fortune)
        localStorage.setItem('spotifyFortuneCookie', JSON.stringify({ fortune: data.fortune, date: todayString }))
        setCanFetchNewFortune(false) 
      } else {
        setError('Could not retrieve a fortune. Please try again.')
        setFortune(null)
      }
    } catch (error) {
      console.error('Error fetching fortune:', error)
      setError('Failed to get your fortune. Please try again.')
      setFortune(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (session && initialLoadRef.current) {
      getFortune()
      initialLoadRef.current = false
    }

    let timerInterval: NodeJS.Timeout | null = null
    let dailyCheckInterval: NodeJS.Timeout | null = null

    if (!canFetchNewFortune) {
      calculateTimeUntilMidnight() // Initial calculation
      timerInterval = setInterval(calculateTimeUntilMidnight, 1000) // Update every second
    } else {
      if (timerInterval) clearInterval(timerInterval)
    }
    
    // Check if it's a new day to re-enable the button
    dailyCheckInterval = setInterval(() => {
      const todayString = getTodayDateString()
      const storedFortuneData = localStorage.getItem('spotifyFortuneCookie')
      if (storedFortuneData) {
        try {
          const parsedData: StoredFortune = JSON.parse(storedFortuneData)
          if (parsedData.date !== todayString) {
            setCanFetchNewFortune(true)
            if (timerInterval) clearInterval(timerInterval) // Stop countdown if new day starts
          }
        } catch (e) {
          setCanFetchNewFortune(true)
          if (timerInterval) clearInterval(timerInterval)
        }
      } else {
        setCanFetchNewFortune(true)
        if (timerInterval) clearInterval(timerInterval)
      }
    }, 30000) // Check every 30 seconds for more responsiveness than 1 minute

    return () => {
      if (timerInterval) clearInterval(timerInterval)
      if (dailyCheckInterval) clearInterval(dailyCheckInterval)
    }
  }, [session, canFetchNewFortune])

  return (
    <Layout>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Spotify Fortune Cookie
          </h1>
          <p className={styles.subtitle}>
            Your daily fortune based on your musical aura
          </p>
        </div>

        {!session ? (
          <Button onClick={() => signIn('spotify')}>
            Connect with Spotify
          </Button>
        ) : (
          <div className={styles.fortuneSection}>
            <FortuneDisplay 
              fortune={fortune} 
              loading={loading} 
              error={error}
            />
            
            <div className={styles.buttonGroup}>
              {error?.includes('permissions') ? (
                <Button
                  onClick={() => signOut()}
                  variant="primary"
                >
                  Sign Out to Refresh Permissions
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => getFortune(true)}
                    disabled={loading || !canFetchNewFortune}
                    title={!canFetchNewFortune && fortune ? "You already have your fortune for today! Check back tomorrow." : undefined}
                  >
                    {loading ? 'Opening cookie...' : (canFetchNewFortune || !fortune ? 'Get Your Daily Fortune 🥠' : 'Today\'s Fortune Received')}
                  </Button>
                  {!canFetchNewFortune && fortune && (
                    <p className={styles.timer}>
                      New fortune in: {String(timeLeft.hours).padStart(2, '0')}:{
                        String(timeLeft.minutes).padStart(2, '0')}:{
                        String(timeLeft.seconds).padStart(2, '0')}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 