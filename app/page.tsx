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

  const getFortune = async (isManualRequest = false) => {
    if (!session) return

    const todayString = getTodayDateString()
    const storedFortuneData = localStorage.getItem('spotifyFortuneCookie')

    if (!isManualRequest && storedFortuneData) {
      try {
        const parsedData: StoredFortune = JSON.parse(storedFortuneData)
        if (parsedData.date === todayString && parsedData.fortune) {
          setFortune(parsedData.fortune)
          setCanFetchNewFortune(false) // Already have today's fortune
          setError(null)
          setLoading(false)
          return
        }
      } catch (e) {
        console.error("Error parsing stored fortune:", e)
        localStorage.removeItem('spotifyFortuneCookie') // Clear corrupted data
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
        setCanFetchNewFortune(false) // Just fetched today's fortune
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
      getFortune() // Attempt to load from localStorage or fetch new if needed
      initialLoadRef.current = false
    }

    // Check if it's a new day to re-enable the button
    const interval = setInterval(() => {
      const todayString = getTodayDateString()
      const storedFortuneData = localStorage.getItem('spotifyFortuneCookie')
      if (storedFortuneData) {
        try {
          const parsedData: StoredFortune = JSON.parse(storedFortuneData)
          if (parsedData.date !== todayString) {
            setCanFetchNewFortune(true)
          }
        } catch (e) {
          // If error, allow fetching new one
          setCanFetchNewFortune(true)
        }
      } else {
        setCanFetchNewFortune(true) // No stored fortune, can fetch
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [session])

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
                    onClick={() => getFortune(true)} // Pass true for manual request
                    disabled={loading || !canFetchNewFortune}
                    title={!canFetchNewFortune && fortune ? "You already have your fortune for today! Check back tomorrow." : undefined}
                  >
                    {loading ? 'Opening cookie...' : (canFetchNewFortune || !fortune ? 'Get Your Daily Fortune 🥠' : 'Today\'s Fortune Received')}
                  </Button>
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