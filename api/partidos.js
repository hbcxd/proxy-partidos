const axios = require('axios');
const cheerio = require('cheerio');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const db = getFirestore();
  const coleccion = db.collection('partidos_en_vivo');

  try {
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
    const snapshot = await coleccion.where('ultimaActualizacion', '>', Timestamp.fromDate(cincoMinutosAtras)).limit(1).get();

    if (!snapshot.empty) {
      const partidos = snapshot.docs.map(doc => doc.data());
      return res.status(200).json({ success: true, fuente: 'Cache (Firebase)', data: partidos });
    }

    const { data } = await axios.get('https://www.flashscore.com/', { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const $ = cheerio.load(data);
    const nuevosPartidos = [];

    // --- AQUÍ ES EXACTAMENTE DONDE VA EL CÓDIGO DEL SELECTOR ---
    $('.event__match').each((i, el) => {
      const local = $(el).find('.event__participant--home').text().trim();
      const visitante = $(el).find('.event__participant--away').text().trim();
      
      if (local && visitante) {
        nuevosPartidos.push({
          local: local,
          visitante: visitante,
          marcador: $(el).find('.event__score').text().trim() || "No iniciado",
          ultimaActualizacion: new Date()
        });
      }
    });
    // --- HASTA AQUÍ LLEGA LA EXTRACCIÓN ---

    if (nuevosPartidos.length > 0) {
      const batch = db.batch();
      nuevosPartidos.forEach(p => {
        const ref = coleccion.doc(p.local + '-' + p.visitante);
        batch.set(ref, p);
      });
      await batch.commit();
    }

    return res.status(200).json({ success: true, fuente: 'Web Scraping (Live)', data: nuevosPartidos });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
