const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { grant_type, code, redirect_uri, code_verifier, refresh_token } = req.body || {};
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server misconfigured: missing Spotify credentials' });
  }

  if (!grant_type) {
    return res.status(400).json({ error: 'grant_type is required' });
  }

  const tokenParams = new URLSearchParams({
    grant_type,
    client_id: clientId,
  });

  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri || !code_verifier) {
      return res.status(400).json({ error: 'code, redirect_uri, and code_verifier are required for authorization_code' });
    }
    tokenParams.set('code', code);
    tokenParams.set('redirect_uri', redirect_uri);
    tokenParams.set('code_verifier', code_verifier);
  } else if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token is required for refresh_token' });
    }
    tokenParams.set('refresh_token', refresh_token);
  } else {
    return res.status(400).json({ error: `Unsupported grant_type: ${grant_type}` });
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const spotifyResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: tokenParams.toString(),
    });

    const data = await spotifyResponse.json();

    if (!spotifyResponse.ok) {
      return res.status(spotifyResponse.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Spotify token exchange failed', error);
    return res.status(500).json({ error: 'Spotify token exchange failed' });
  }
};

module.exports = handler;
