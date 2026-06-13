const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const app = express();
app.use(cors());

app.get('/api/tasas', async (req, res) => {
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get('https://www.bcv.org.ve/', { httpsAgent: agent });
        const $ = cheerio.load(response.data);

        const extraerTasa = (idHTML) => {
            let texto = $(`#${idHTML} .centrado strong`).text().trim();
            texto = texto.replace(',', '.');
            return parseFloat(texto);
        };

        res.json({
            exito: true,
            tasas: {
                USD: extraerTasa('dolar'),
                EUR: extraerTasa('euro')
            }
        });
    } catch (e) {
        res.status(500).json({ exito: false, error: 'No se pudo conectar al BCV' });
    }
});

// Esta línea es la que hace que funcione en Vercel
module.exports = app;
