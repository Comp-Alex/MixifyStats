const connectButton = document.getElementById('connectButton');
const statusPill = document.getElementById('statusPill');
const streakValue = document.getElementById('streakValue');
const topTrack = document.getElementById('topTrack');
const topArtist = document.getElementById('topArtist');
const peakHour = document.getElementById('peakHour');

const sliderIds = ['volume', 'low', 'mid', 'high'];
const valueLabels = {
  volume: document.getElementById('volumeValue'),
  low: document.getElementById('lowValue'),
  mid: document.getElementById('midValue'),
  high: document.getElementById('highValue'),
};

const eqBars = {
  low: document.getElementById('eqLow'),
  mid: document.getElementById('eqMid'),
  high: document.getElementById('eqHigh'),
};

const mockData = {
  streak: '14 day streak',
  track: 'Midnight Echo',
  artist: 'Luna Vale',
  hour: '22:00',
  status: 'Demo mode ready',
};

const STORAGE_KEYS = {
  accessToken: 'mixifystats_access_token',
  refreshToken: 'mixifystats_refresh_token',
  expiresAt: 'mixifystats_expires_at',
  profile: 'mixifystats_profile',
  codeVerifier: 'mixifystats_code_verifier',
  authState: 'mixifystats_auth_state',
};

const DEFAULT_CLIENT_ID = 'b340c0f1c1f142329516f6be01b436bd';

const CONFIG = {
  fallbackRedirectUri: 'http://127.0.0.1:3000/callback.html',
  scopes: ['user-top-read', 'user-read-private', 'user-read-email'],
};

function updateMixerUI() {
  sliderIds.forEach((id) => {
    const input = document.getElementById(id);
    const label = valueLabels[id];
    if (input && label) {
      label.textContent = `${input.value}%`;
    }
  });

  const volume = Number(document.getElementById('volume').value);
  const low = Number(document.getElementById('low').value);
  const mid = Number(document.getElementById('mid').value);
  const high = Number(document.getElementById('high').value);

  eqBars.low.style.height = `${Math.max(20, low)}%`;
  eqBars.mid.style.height = `${Math.max(24, mid)}%`;
  eqBars.high.style.height = `${Math.max(22, high)}%`;

  const intensity = Math.round((volume + low + mid + high) / 4);
  document.querySelector('.hero-panel .panel-card.compact .mini-label').textContent = `Tonight's energy · ${intensity}%`;
}

function setDemoState(statusText = 'Ready to connect to Spotify') {
  document.body.classList.remove('connected');
  statusPill.textContent = statusText;
  streakValue.textContent = mockData.streak;
  topTrack.textContent = mockData.track;
  topArtist.textContent = mockData.artist;
  peakHour.textContent = mockData.hour;
  updateConnectButton(false);
}

function getConfiguredClientId() {
  return DEFAULT_CLIENT_ID;
}

function getRedirectUri() {
  const origin = window.location.origin;
  if (origin && origin !== 'null' && origin !== 'file://') {
    return `${origin}/callback.html`;
  }
  return CONFIG.fallbackRedirectUri;
}

function setConnectedState(profileName, streakText, trackName, artistName, hourText) {
  document.body.classList.add('connected');
  statusPill.textContent = `Connected to Spotify · ${profileName}`;
  streakValue.textContent = streakText;
  topTrack.textContent = trackName;
  topArtist.textContent = artistName;
  peakHour.textContent = hourText;
  updateConnectButton(true);
}

function getStoredValue(key) {
  return window.localStorage.getItem(key);
}

function storeValue(key, value) {
  window.localStorage.setItem(key, value);
}

function clearStoredAuth() {
  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
}

function generateRandomString(length) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlEncode(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function startSpotifyAuth() {
  const clientId = getConfiguredClientId();
  if (!clientId) {
    statusPill.textContent = 'Enter your Spotify Client ID to sign in';
    return;
  }

  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);

  storeValue(STORAGE_KEYS.codeVerifier, codeVerifier);
  storeValue(STORAGE_KEYS.authState, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: CONFIG.scopes.join(' '),
    redirect_uri: getRedirectUri(),
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function getStoredAccessToken() {
  return getStoredValue(STORAGE_KEYS.accessToken);
}

function getStoredRefreshToken() {
  return getStoredValue(STORAGE_KEYS.refreshToken);
}

function getStoredExpiresAt() {
  return Number(getStoredValue(STORAGE_KEYS.expiresAt) || 0);
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  const clientId = getConfiguredClientId();
  if (!refreshToken || !clientId) return null;

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    clearStoredAuth();
    return null;
  }

  const data = await response.json();
  storeValue(STORAGE_KEYS.accessToken, data.access_token);
  storeValue(STORAGE_KEYS.expiresAt, String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) {
    storeValue(STORAGE_KEYS.refreshToken, data.refresh_token);
  }
  return data.access_token;
}

async function ensureValidToken() {
  const accessToken = getStoredAccessToken();
  if (accessToken && getStoredExpiresAt() > Date.now()) {
    return accessToken;
  }
  return refreshAccessToken();
}

function isSpotifyConnected() {
  return Boolean(getStoredRefreshToken() || (getStoredAccessToken() && getStoredExpiresAt() > Date.now()));
}

async function loadSpotifyData() {
  const accessToken = await ensureValidToken();
  if (!accessToken) {
    statusPill.textContent = 'Ready to connect to Spotify';
    updateConnectButton(isSpotifyConnected());
    return;
  }

  try {
    const [profileResponse, tracksResponse, artistsResponse] = await Promise.all([
      fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=medium_term', { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=1&time_range=medium_term', { headers: { Authorization: `Bearer ${accessToken}` } }),
    ]);

    if (!profileResponse.ok || !tracksResponse.ok || !artistsResponse.ok) {
      throw new Error('Spotify data request failed');
    }

    const profile = await profileResponse.json();
    const tracks = await tracksResponse.json();
    const artists = await artistsResponse.json();
    const track = tracks.items?.[0];
    const artist = artists.items?.[0];

    const profileName = profile.display_name || profile.id || 'Spotify listener';
    const trackName = track?.name || 'Midnight Echo';
    const artistName = artist?.name || track?.artists?.[0]?.name || 'Luna Vale';
    const streakText = `${Math.min(30, Math.max(7, Math.round((artist?.popularity || 60) / 5)))} day streak`;
    const hourText = '22:00';

    setConnectedState(profileName, streakText, trackName, artistName, hourText);
  } catch (error) {
    console.error(error);
    setDemoState();
    statusPill.textContent = 'Spotify connection failed. Verify your client ID and redirect URI.';
  }
}

function updateConnectButton(isConnected) {
  connectButton.textContent = isConnected ? 'Disconnect Spotify' : 'Connect Spotify';
  connectButton.dataset.connected = isConnected ? 'true' : 'false';
}

function disconnectSpotify() {
  clearStoredAuth();
  setDemoState('Disconnected from Spotify');
}

connectButton.addEventListener('click', async () => {
  const accessToken = getStoredAccessToken();
  if (accessToken) {
    disconnectSpotify();
    return;
  }

  await startSpotifyAuth();
});

sliderIds.forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener('input', updateMixerUI);
});

updateMixerUI();
setDemoState();
loadSpotifyData();
