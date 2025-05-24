# Spotify Fortune Cookie 🎵 🥠

Get your daily fortune based on your Spotify listening history! This web application combines the magic of music with mystical predictions to give you personalized fortunes.

## Features

- Login with your Spotify account
- Get personalized fortunes based on your recent listening history
- Beautiful, responsive UI with dark mode support
- Secure authentication using NextAuth.js

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spotify-fortune-cookie.git
cd spotify-fortune-cookie
```

2. Install dependencies:
```bash
npm install
```

3. Create a Spotify Developer Application:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new application
   - Add `http://127.0.0.1:3000/api/auth/callback/spotify` to the Redirect URIs
     - Note: Using `127.0.0.1` instead of `localhost` is required by Spotify's security policy
   - Note down the Client ID and Client Secret

4. Create a `.env.local` file in the root directory with the following content:
```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://127.0.0.1:3000
NEXTAUTH_SECRET=your_random_secret_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser

## Environment Variables

- `SPOTIFY_CLIENT_ID`: Your Spotify application client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify application client secret
- `NEXTAUTH_URL`: The base URL of your application (must use 127.0.0.1 instead of localhost)
- `NEXTAUTH_SECRET`: A random string used to hash tokens (generate one using `openssl rand -base64 32`)

## Important Notes

### Spotify Redirect URI Requirements
- The application uses `http://127.0.0.1:3000` instead of `localhost` as per Spotify's security requirements
- When deploying to production, make sure to use HTTPS for your redirect URI
- Valid redirect URI formats:
  - Development: `http://127.0.0.1:3000/api/auth/callback/spotify`
  - Production: `https://yourdomain.com/api/auth/callback/spotify`

## Technologies Used

- Next.js 14
- TypeScript
- NextAuth.js
- Tailwind CSS
- Spotify Web API

## Contributing

Feel free to open issues and pull requests! 