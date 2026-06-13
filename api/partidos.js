const axios = require('axios');
const cheerio = require('cheerio');
const { getFirestore } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Usamos una URL que apunta a los resultados en vivo
    const { data } = await axios.get('https://www.flashscore.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(data);
    const partidos = [];

    // Este selector busca las cajas de partidos en la página de inicio
    $('.event__match').each((i, el) => {
      partidos.push({
        local: $(el).find('.event__participant--home').text().trim(),
        visitante: $(el).find('.event__participant--away').text().trim(),
        marcador: $(el).find('.event__score').text().trim()
      });
    });

    // Guardamos en Firebase para dejar constancia de la captura
    const db = getFirestore();
    await db.collection('capturas_prueba').add({
      fecha: new Date().toISOString(),
      partidos: partidos
    });

    res.status(200).json({ success: true, count: partidos.length, data: partidos });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
