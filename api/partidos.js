const axios = require('axios');
const cheerio = require('cheerio');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Inicialización de Firebase (mantiene la conexión abierta)
if (getApps().length === 0) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const db = getFirestore();
  const coleccion = db.collection('partidos_en_vivo');

  try {
    // 1. Verificamos si hay datos recientes (hace menos de 5 minutos)
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
    const snapshot = await coleccion.where('ultimaActualizacion', '>', Timestamp.fromDate(cincoMinutosAtras)).get();

    if (!snapshot.empty) {
      // SI HAY DATOS FRESCOS: Los devolvemos directamente
      const partidos = snapshot.docs.map(doc => doc.data());
      return res.status(200).json({ success: true, fuente: 'Firebase (Cache)', data: partidos });
    }

    // 2. SI NO HAY DATOS: Ejecutamos el Scraper de Flashscore
    const { data } = await axios.get('https://www.flashscore.com/', { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const $ = cheerio.load(data);
    const nuevosPartidos = [];

    $('.event__match').each((i, el) => {
      nuevosPartidos.push({
        local: $(el).find('.event__participant--home').text().trim(),
        visitante: $(el).find('.event__participant--away').text().trim(),
        marcador: $(el).find('.event__score').text().trim(),
        ultimaActualizacion: new Date()
      });
    });

    // 3. Guardamos los nuevos datos en Firebase
    const batch = db.batch();
    nuevosPartidos.forEach(p => batch.set(coleccion.doc(p.local + '-' + p.visitante), p));
    await batch.commit();

    return res.status(200).json({ success: true, fuente: 'Web Scraping (Live)', data: nuevosPartidos });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
