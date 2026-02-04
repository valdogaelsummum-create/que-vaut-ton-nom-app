
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = 'https://votre-domaine.com/callback';

// 1. Initialiser l'authentification (Rediriger l'utilisateur vers TikTok)
app.get('/auth', (req, res) => {
    const csrfState = crypto.randomBytes(16).toString('hex');
    res.cookie('csrfState', csrfState);

    let url = 'https://www.tiktok.com/v2/auth/authorize/';
    url += `?client_key=${CLIENT_KEY}`;
    url += '&scope=user.info.basic,live.interaction';
    url += '&response_type=code';
    url += `&redirect_uri=${REDIRECT_URI}`;
    url += `&state=${csrfState}`;

    res.redirect(url);
});

// 2. Callback pour échanger le code contre un Access Token
app.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    
    try {
        const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', 
            new URLSearchParams({
                client_key: CLIENT_KEY,
                client_secret: CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        
        const accessToken = response.data.access_token;
        // Sauvegarder l'accessToken pour cet utilisateur
        res.send('Authentification réussie ! Vous pouvez fermer cette fenêtre.');
    } catch (error) {
        res.status(500).send('Erreur d\'authentification');
    }
});

// 3. Réception des Webhooks (C'est ici que les événements arrivent en temps réel)
app.post('/webhook/tiktok', (req, res) => {
    const signature = req.headers['x-tiktok-signature'];
    const payload = JSON.stringify(req.body);

    // TODO: Vérifier la signature HMAC avec votre CLIENT_SECRET pour la sécurité
    
    const event = req.body;
    
    /* Structure attendue des événements officiels :
       {
         "event": "gift",
         "data": {
           "user_id": "123",
           "nickname": "Jean",
           "gift_id": "rose_01",
           "count": 5
         }
       }
    */

    console.log('Nouvel événement TikTok reçu:', event);

    // Envoyer à votre frontend via WebSocket
    // io.emit('tiktok_event', event);

    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur API TikTok actif sur le port ${PORT}`));
