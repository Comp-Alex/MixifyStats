const connectButton = document.getElementById('connectButton');
const statusPill = document.getElementById('statusPill');
const streakValue = document.getElementById('streakValue');
const topTrack = document.getElementById('topTrack');
const topArtist = document.getElementById('topArtist');
const peakHour = document.getElementById('peakHour');
const weeklyMoodBadge = document.getElementById('weeklyMoodBadge');
const weeklyMoodSummary = document.getElementById('weeklyMoodSummary');
const moodRangeLabel = document.getElementById('moodRangeLabel');
const moodChart = document.getElementById('moodChart');
const moodInput = document.getElementById('moodInput');
const applyMoodButton = document.getElementById('applyMoodButton');
const moodFeedback = document.getElementById('moodFeedback');
const rangeButtons = Array.from(document.querySelectorAll('.range-btn'));

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

function getAppBaseUrl() {
  const { origin, pathname } = window.location;
  const trimmedPath = pathname.replace(/\/+$/, '');
  const segments = trimmedPath.split('/').filter(Boolean);

  if (segments.length && ['callback', 'callback.html'].includes(segments[segments.length - 1])) {
    segments.pop();
  }

  const normalizedPath = segments.length ? `/${segments.join('/')}` : '';
  return `${origin}${normalizedPath}`;
}

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

function mapMoodToMix(prompt) {
  const text = (prompt || '').toLowerCase();

  if (text.includes('sleepy') || text.includes('chill') || text.includes('dreamy')) {
    return {
      volume: 58,
      low: 72,
      mid: 38,
      high: 26,
      feedback: 'DJ mode: dreamy and mellow, with wide low-end warmth.',
    };
  }

  if (text.includes('upbeat') || text.includes('happy') || text.includes('party')) {
    return {
      volume: 88,
      low: 46,
      mid: 78,
      high: 84,
      feedback: 'DJ mode: bright and energetic, perfect for a lift.',
    };
  }

  if (text.includes('focus') || text.includes('study') || text.includes('calm')) {
    return {
      volume: 64,
      low: 34,
      mid: 58,
      high: 42,
      feedback: 'DJ mode: focused and balanced, with clean clarity.',
    };
  }

  if (text.includes('late') || text.includes('night') || text.includes('moody')) {
    return {
      volume: 70,
      low: 60,
      mid: 52,
      high: 64,
      feedback: 'DJ mode: late-night and moody, with a deep immersive feel.',
    };
  }

  return {
    volume: 72,
    low: 46,
    mid: 60,
    high: 56,
    feedback: 'DJ mode: balanced and warm, tuned for a steady groove.',
  };
}

function applyMoodMix() {
  const moodText = moodInput?.value || '';
  const settings = mapMoodToMix(moodText);

  document.getElementById('volume').value = settings.volume;
  document.getElementById('low').value = settings.low;
  document.getElementById('mid').value = settings.mid;
  document.getElementById('high').value = settings.high;
  if (moodFeedback) {
    moodFeedback.textContent = settings.feedback;
  }
  updateMixerUI();
}

function renderMoodOverview(data) {
  if (weeklyMoodBadge) {
    weeklyMoodBadge.textContent = data.label;
  }

  if (weeklyMoodSummary) {
    weeklyMoodSummary.textContent = data.summary;
  }

  if (moodChart) {
    moodChart.innerHTML = data.bars.map((bar) => `
      <div class="chart-bar-group">
        <div class="chart-bar" style="--height: ${Math.max(18, bar.value)}%; --bar-color: ${bar.color};"></div>
        <span class="chart-bar-label">${bar.label}</span>
      </div>
    `).join('');
  }
}

function setActiveRange(range) {
  rangeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.range === range);
  });
}

function getRangeLabel(range) {
  switch (range) {
    case 'week':
      return 'Weekly';
    case 'month':
      return 'Monthly';
    default:
      return 'Daily';
  }
}

function getRangePhrase(range) {
  switch (range) {
    case 'day':
      return 'today';
    case 'month':
      return 'this month';
    default:
      return 'this week';
  }
}

function setMoodRangeLabel(range) {
  if (!moodRangeLabel) return;
  const label = range === 'day' ? 'Daily mood' : range === 'month' ? 'Monthly mood' : 'Weekly mood';
  moodRangeLabel.textContent = label;
}

function setDemoState(statusText = 'Ready to connect to Spotify') {
  document.body.classList.remove('connected');
  statusPill.textContent = statusText;
  streakValue.textContent = mockData.streak;
  topTrack.textContent = mockData.track;
  topArtist.textContent = mockData.artist;
  peakHour.textContent = mockData.hour;
  renderMoodOverview({
    label: 'Balanced glow',
    summary: 'Your demo listening period feels steady, reflective, and easy to move with.',
    bars: [
      { label: 'Energy', value: 72, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      { label: 'Mood', value: 68, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      { label: 'Flow', value: 76, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      { label: 'Tempo', value: 64, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      { label: 'Focus', value: 82, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
    ],
  });
  updateConnectButton(false);
}

function getConfiguredClientId() {
  return DEFAULT_CLIENT_ID;
}

function getCallbackPath() {
  const hostname = window.location.hostname;
  if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1') {
    return '/callback.html';
  }
  return '/callback';
}

function getRedirectUri() {
  const configuredRedirectUri = new URLSearchParams(window.location.search).get('redirect_uri');
  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  const origin = window.location.origin;
  if (origin && origin !== 'null' && origin !== 'file://') {
    return `${getAppBaseUrl()}${getCallbackPath()}`;
  }

  console.warn('Running from file://; Spotify login requires a local HTTP server at http://127.0.0.1:3000');
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
  if (!refreshToken) return null;

  const response = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
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

function getMoodFromAudioFeatures(audioFeatures, topTrackName, topArtistName, range = 'week') {
  const rangeLabel = getRangeLabel(range);
  const rangePhrase = getRangePhrase(range);
  if (!audioFeatures?.length) {
    return {
      label: 'Balanced glow',
      summary: `${topArtistName || 'Your favorite artist'} is setting a calm, steady rhythm ${rangePhrase}.`,
      bars: [
        { label: 'Energy', value: 68, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
        { label: 'Mood', value: 72, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
        { label: 'Flow', value: 70, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
        { label: 'Tempo', value: 60, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
        { label: 'Focus', value: 76, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      ],
    };
  }

  const averageEnergy = audioFeatures.reduce((sum, feature) => sum + (feature?.energy || 0), 0) / audioFeatures.length;
  const averageValence = audioFeatures.reduce((sum, feature) => sum + (feature?.valence || 0), 0) / audioFeatures.length;
  const averageDanceability = audioFeatures.reduce((sum, feature) => sum + (feature?.danceability || 0), 0) / audioFeatures.length;
  const averageTempo = audioFeatures.reduce((sum, feature) => sum + (feature?.tempo || 0), 0) / audioFeatures.length;
  const averageAcousticness = audioFeatures.reduce((sum, feature) => sum + (feature?.acousticness || 0), 0) / audioFeatures.length;

  const energyScore = Math.round(averageEnergy * 100);
  const moodScore = Math.round(averageValence * 100);
  const flowScore = Math.round((averageDanceability * 0.7 + averageEnergy * 0.3) * 100);
  const tempoScore = Math.round(Math.min(100, (averageTempo / 200) * 100));
  const focusScore = Math.round((averageEnergy * 0.6 + (1 - averageAcousticness) * 0.4) * 100);

  let label = 'Balanced glow';
  let summary = `${topTrackName || 'your favorite track'} is carrying ${rangePhrase}, with a balanced and easygoing rhythm.`;

  if (energyScore >= 78 && moodScore >= 74) {
    label = 'High-energy lift';
    summary = `${getRangeLabel(range)} listening feels upbeat and electric. ${topArtistName || 'Your top artist'} is bringing a bright, confident pulse.`;
  } else if (energyScore <= 45 && moodScore <= 45) {
    label = 'Chill reset';
    summary = `${getRangeLabel(range)} listening is leaning calm and reflective. ${topTrackName || 'Your top track'} is perfect for winding down.`;
  } else if (moodScore >= 70) {
    label = 'Sunny momentum';
    summary = `The vibe is warm and optimistic. ${topArtistName || 'Your top artist'} is keeping ${rangePhrase} feeling light and joyful.`;
  } else if (energyScore >= 65) {
    label = 'Focused drive';
    summary = `You are leaning into a focused, driven groove. ${topTrackName || 'your favorite track'} is keeping the momentum strong.`;
  }

  return {
    label,
    summary,
    bars: [
      { label: 'Energy', value: energyScore, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      { label: 'Mood', value: moodScore, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      { label: 'Flow', value: flowScore, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      { label: 'Tempo', value: tempoScore, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
      { label: 'Focus', value: focusScore, color: 'linear-gradient(180deg, #8ff0b4, #2ea962)' },
    ],
  };
}

async function loadSpotifyData(range = 'week') {
  const accessToken = await ensureValidToken();
  if (!accessToken) {
    statusPill.textContent = 'Ready to connect to Spotify';
    updateConnectButton(isSpotifyConnected());
    return;
  }

  try {
    const timeRange = range === 'month' ? 'medium_term' : range === 'day' ? 'short_term' : 'medium_term';
    const [profileResponse, tracksResponse, artistsResponse] = await Promise.all([
      fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch(`https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=${timeRange}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch(`https://api.spotify.com/v1/me/top/artists?limit=3&time_range=${timeRange}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
    ]);

    if (!profileResponse.ok || !tracksResponse.ok || !artistsResponse.ok) {
      throw new Error('Spotify data request failed');
    }

    const profile = await profileResponse.json();
    const tracksData = await tracksResponse.json();
    const artistsData = await artistsResponse.json();
    const tracks = tracksData.items || [];
    const artists = artistsData.items || [];
    const track = tracks[0];
    const artist = artists[0];

    let audioFeatures = [];
    const trackIds = tracks.slice(0, 5).map((item) => item?.id).filter(Boolean);
    if (trackIds.length) {
      const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json();
        audioFeatures = featuresData.audio_features || [];
      }
    }

    const profileName = profile.display_name || profile.id || 'Spotify listener';
    const trackName = track?.name || 'Midnight Echo';
    const artistName = artist?.name || track?.artists?.[0]?.name || 'Luna Vale';
    const streakText = `${Math.min(30, Math.max(7, Math.round((artist?.popularity || 60) / 5)))} day streak`;
    const hourText = '22:00';
    const moodData = getMoodFromAudioFeatures(audioFeatures, trackName, artistName, range);

    setConnectedState(profileName, streakText, trackName, artistName, hourText);
    renderMoodOverview(moodData);
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

if (applyMoodButton) {
  applyMoodButton.addEventListener('click', applyMoodMix);
}

if (moodInput) {
  moodInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      applyMoodMix();
    }
  });
}

rangeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const range = button.dataset.range || 'week';
    setActiveRange(range);
    setMoodRangeLabel(range);
    loadSpotifyData(range);
  });
});

setMoodRangeLabel('week');
updateMixerUI();
setDemoState();
loadSpotifyData('week');
