import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../auth/auth.config'

interface SpotifyTrack {
  track?: {
    name: string
    artists: Array<{
      name: string
    }>
    external_urls: {
      spotify: string
    }
    preview_url: string | null
    album: {
      images: Array<{
        url: string
        height: number
        width: number
      }>
    }
  }
  // For top tracks which don't have the 'track' wrapper
  name?: string
  artists?: Array<{
    name: string
  }>
  external_urls?: {
    spotify: string
  }
  preview_url?: string | null
  album?: {
    images: Array<{
      url: string
      height: number
      width: number
    }>
  }
}

interface SpotifyResponse {
  items: SpotifyTrack[]
}

async function getRecentTracks(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch recent tracks: ${response.status}`)
  }
  
  const data = await response.json()
  // console.log('Recent tracks response:', JSON.stringify(data, null, 2))
  return data
}

async function getTopTracks(accessToken: string, timeRange: 'short_term' | 'medium_term' | 'long_term') {
  const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch top tracks: ${response.status}`)
  }
  
  const data = await response.json()
  // console.log(`Top tracks (${timeRange}) response:`, JSON.stringify(data, null, 2))
  return data
}

function normalizeTrack(track: SpotifyTrack): { 
  name: string
  artistName: string
  spotifyUrl: string
  previewUrl: string | null
  albumArtUrl: string | null
} {
  let normalizedTrack;
  if (track.track) {
    normalizedTrack = {
      name: track.track.name,
      artistName: track.track.artists[0].name,
      spotifyUrl: track.track.external_urls.spotify,
      previewUrl: track.track.preview_url,
      albumArtUrl: track.track.album?.images[0]?.url || null
    }
  } else {
    normalizedTrack = {
      name: track.name!,
      artistName: track.artists![0].name,
      spotifyUrl: track.external_urls!.spotify,
      previewUrl: track.preview_url || null,
      albumArtUrl: track.album?.images[0]?.url || null
    }
  }
  // console.log('Normalized track:', normalizedTrack)
  return normalizedTrack
}

function generateFortune(allTracks: SpotifyTrack[]) {
  const fortunes = [
    // Original fortunes, rephrased for one song
    "Your musical journey, highlighted by songs like {trackName} by {artistName}, suggests exciting opportunities ahead!",
    "Like the rhythm of {trackName}, life will flow smoothly for you.",
    "A surprising melody, perhaps one like {trackName} by {artistName}, awaits in your future.",
    "Your eclectic taste, shown by your enjoyment of {trackName}, will lead to interesting connections.",
    "The song {trackName} by {artistName} hints at a positive change coming your way.",
    "Your choice of {trackName} reveals hidden wisdom - trust your instincts.",
    "Like a perfect playlist featuring {trackName}, your plans will come together beautifully.",
    "The harmony in {trackName} by {artistName} reflects harmony coming to your life.",
    "Your recent enjoyment of {trackName} suggests it's time to try something new!",
    "The music you enjoy, like {trackName} by {artistName}, points to unexpected good fortune.",
    "The soundtrack of your life, with {trackName} as a key feature, is building towards something special.",
    "Your musical preference for {trackName} by {artistName} suggests an exciting adventure is coming.",
    "Like your favorite chorus in {trackName}, good things will come around again.",
    "The diverse rhythms you enjoy, exemplified by {trackName} by {artistName}, will create beautiful opportunities.",
    "Your musical taste for {trackName} suggests you're ready for positive changes.",

    // New variations
    "Let the vibe of {trackName} by {artistName} guide your steps today; new paths are opening up.",
    "The energy of {trackName} is a sign: embrace the unexpected, and joy will follow.",
    "Reflect on the feeling {trackName} by {artistName} gives you; it holds a clue to your next success.",
    "Channel the spirit of {trackName} today, and you'll overcome any challenge.",
    "The discovery of (or re-listening to) {trackName} by {artistName} is a reminder: good things are all around.",
    "As {trackName} resonates with you, so too will good fortune in the coming days.",
    "The essence of {trackName} by {artistName} whispers of a serendipitous encounter soon.",
    "If {trackName} is your current mood, then prepare for a wave of creative inspiration.",
    "Consider the message of {trackName} by {artistName}; it might be the key to unlocking a new perspective.",
    "Your connection to {trackName} indicates a period of growth and self-discovery is upon you.",
    "Just as {artistName} crafted {trackName}, you are crafting a beautiful future. Keep going!",
    "The memories tied to {trackName} could signify a pleasant surprise from the past resurfacing.",
    "Let {trackName} by {artistName} be your anthem for today; great things are achievable.",
    "The unique sound of {trackName} mirrors the unique opportunities heading your way.",
    "Find inspiration in {trackName} by {artistName} today, and watch how your day transforms."
  ]

  if (allTracks.length === 0) {
    return {
        text: "We couldn't find any tracks to generate your fortune. Listen to more music on Spotify!",
        tracks: []
    }
  }

  const trackIndex = Math.floor(Math.random() * allTracks.length)
  const selectedTrack = normalizeTrack(allTracks[trackIndex])

  let baseFortune = fortunes[Math.floor(Math.random() * fortunes.length)]
  
  // Replace placeholders with track details
  baseFortune = baseFortune.replace("{trackName}", selectedTrack.name)
                         .replace("{artistName}", selectedTrack.artistName)
  
  return {
    text: baseFortune,
    tracks: [selectedTrack] // Now an array with a single track
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated or missing access token' },
        { status: 401 }
      )
    }
    
    const [recentTracks, topTracksShortTerm, topTracksMediumTerm, topTracksLongTerm] = await Promise.all([
      getRecentTracks(session.accessToken) as Promise<SpotifyResponse>,
      getTopTracks(session.accessToken, 'short_term') as Promise<SpotifyResponse>,
      getTopTracks(session.accessToken, 'medium_term') as Promise<SpotifyResponse>,
      getTopTracks(session.accessToken, 'long_term') as Promise<SpotifyResponse>
    ])
    
    const allTracks = [
      ...recentTracks.items,
      ...topTracksShortTerm.items,
      ...topTracksMediumTerm.items,
      ...topTracksLongTerm.items
    ].filter(item => item !== null && (item.track !== null || item.name !== null)) // Filter out potential null items

    if (allTracks.length === 0) {
        return NextResponse.json({ 
            fortune: { 
                text: "Couldn't generate a fortune based on your listening history. Try listening to more music!", 
                tracks: [] 
            }
        })
    }
        
    const fortune = generateFortune(allTracks)
    
    // console.log('Generated fortune:', fortune)
    return NextResponse.json({ fortune })
  } catch (error) {
    console.error('Error generating fortune:', error)
    return NextResponse.json(
      { error: 'Failed to generate fortune', details: (error as Error).message },
      { status: 500 }
    )
  }
}