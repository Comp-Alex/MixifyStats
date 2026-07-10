# MixifyStats

A Spotify-style stats dashboard with a DJ mixer UI. Visualize your listening habits, connect a real Spotify account, and surface your top tracks and artists from the Spotify Web API.

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
1. Create a Spotify app at https://developer.spotify.com/dashboard.
2. Add a redirect URI for your local preview:
   - http://127.0.0.1:3000/callback.html
3. In [script.js](script.js), replace the placeholder client ID with your Spotify app's client ID.
4. Start the local preview:
   - python -m http.server 3000
5. Open http://127.0.0.1:3000 and click Connect Spotify.

---

## Deployment
1. Push this project to GitHub.
2. Import it into Vercel.
3. Add the same redirect URI to your Spotify app for your production domain, such as:
   - https://your-app.vercel.app/callback.html
4. Replace the client ID in [script.js](script.js) with your production app's client ID.
