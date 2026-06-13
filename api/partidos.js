const axios = require('axios');
const cheerio = require('cheerio');
const { getFirestore } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const db = getFirestore();
  const fuentes = [
    { nombre: 'Flashscore', url: 'https://www.flashscore.com/' },
    { nombre: 'Besoccer', url: 'https://www.besoccer.com/' }
  ];

  try {
    // 1. Intentamos obtener datos (aquí haremos la lógica de Scraping)
    // Usaremos axios para descargar y cheerio para limpiar el contenido
    const { data } = await axios.get(fuentes[0].url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const $ = cheerio.load(data);
    
    // Ejemplo: Extraer nombres de partidos (luego definiremos los selectores CSS exactos)
    const partidosExtraidos = [];
    $('.event__match').each((i, el) => {
      partidosExtraidos.push({
        local: $(el).find('.event__participant--home').text(),
        visitante: $(el).find('.event__participant--away').text(),
        resultado: $(el).find('.event__score').text()
      });
    });

    // 2. Guardamos en tu Firebase (el "supositorio" de datos)
    if (partidosExtraidos.length > 0) {
      await db.collection('partidos_activos').doc('resumen_actual').set({
        datos: partidosExtraidos,
        ultimaActualizacion: new Date().toISOString()
      });
    }

    res.status(200).json({ success: true, count: partidosExtraidos.length, data: partidosExtraidos });

  } catch (error) {
    res.status(500).json({ success: false, error: "Error al extraer datos", detalle: error.message });
  }
};
