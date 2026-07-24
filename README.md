# MixifyStats

This is my development of MixifyStats — a Spotify-style stats dashboard with a DJ mixer UI. Visualize listening habits, connect a Spotify account, and surface top tracks and artists with mood-driven analytics.

---

## Features
- Spotify OAuth with Authorization Code + PKCE
- Live stats dashboard for top tracks and top artists
- DJ-style mixer UI with animated EQ visuals
- Responsive dark interface inspired by modern streaming apps

---

## Tech Stack
- Frontend: HTML + CSS + JavaScript
- Auth: Spotify Web API + OAuth 2.0 Authorization Code Flow with PKCE
- Deployment: Vercel-compatible static site

---

## Setup Spotify OAuth
> IMPORTANT: If you accidentally shared your Spotify client secret (for example in chat or a public repo), rotate it immediately in the Spotify Developer Dashboard and update your deployment environment variables. Do not place the client secret in any client-side files such as `callback.html` or `index.html`.

1. Create a Spotify app at https://developer.spotify.com/dashboard.
2. Add this redirect URI in Spotify:
   - Local dev and Vercel: `https://<your-vercel-domain>/`
3. In [script.js](script.js), the Spotify developer client ID is already set to `b340c0f1c1f142329516f6be01b436bd`.
4. Start the local preview from the project root with an HTTP server:
   - python -m http.server 3000
5. Open http://127.0.0.1:3000 in your browser and click Connect Spotify.

> The app now uses the root URL as the OAuth callback target, so Spotify should redirect to the index page at `/`.

> Do not open `index.html` directly from the file system (`file://`). Spotify login requires a local HTTP server or deployed app URL.

---

## Backend support
This project now includes a Vercel backend endpoint for Spotify token exchange. The client ID is already configured in the frontend, so the only required production secret is `SPOTIFY_CLIENT_SECRET` in Vercel.

> In production on Vercel, the app will use `/api/token` for token exchange.
> The direct browser token exchange fallback is only enabled for local development on `localhost` or `127.0.0.1`.

### Vercel environment variables
Set these in your Vercel project settings:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

> Keep `SPOTIFY_CLIENT_SECRET` private. Do not store it in the repository or commit it to Git.

### Local testing
You can still run locally, but you need a local server that supports the API route, such as Vercel CLI or a Node environment.

To test locally with environment variables:

1. Copy `.env.example` to `.env` and fill in `SPOTIFY_CLIENT_SECRET`.
2. Ensure `.env` is listed in `.gitignore` so you don't commit secrets.
3. Use a local server (Vercel CLI or Node) that loads environment variables from `.env`.

If you deployed the secret to Vercel, set `SPOTIFY_CLIENT_SECRET` in the Vercel dashboard under Project Settings → Environment Variables.

---

## Deployment
1. Push this project to GitHub.
2. Import it into Vercel.
3. Add the same redirect URI to your Spotify app for your production domain, such as:
   - https://your-app.vercel.app/
4. In the Vercel dashboard, add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` as environment variables.
5. Deploy the app and then click Connect Spotify to test login flow.
