import { DefaultSession, NextAuthOptions } from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'

// Extend the built-in session type to include accessToken
declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string
    error?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: [
            'user-read-recently-played',
            'user-read-playback-state',
            'user-top-read',
            'user-read-currently-playing',
            'user-read-email',
            'user-read-private',
            'user-read-playback-position',
            'playlist-read-private',
            'playlist-read-collaborative',
            'streaming',
            'user-library-read',
            'user-top-read'
          ].join(' '),
          show_dialog: true
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account && account.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = (account.expires_at || 0) * 1000
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      return session
    }
  },
  debug: process.env.NODE_ENV === 'development'
} 