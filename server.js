require('dotenv').config();
const express = require('express');
const path = require('path');

const tokenHandler = require('./api/token');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// Token exchange endpoint used by the frontend
app.post('/api/token', (req, res) => {
  return tokenHandler(req, res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`MixifyStats dev server listening on http://127.0.0.1:${port}`);
});
