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
        // 1. Verificación de Cache
        const snapshot = await coleccion.limit(1).get();
        if (!snapshot.empty) {
            const partidos = snapshot.docs.map(doc => doc.data());
            return res.status(200).json({ success: true, fuente: 'Cache', data: partidos });
        }

        // 2. Scraping más agresivo
        const { data } = await axios.get('https://www.besoccer.com/livescore', { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        
        const $ = cheerio.load(data);
        const nuevosPartidos = [];

        // Buscamos cualquier fila que parezca un partido
        $('.match').each((i, el) => {
            const local = $(el).find('.team-name').first().text().trim();
            const visit = $(el).find('.team-name').last().text().trim();
            if (local && visit) {
                nuevosPartidos.push({ local, visit, status: 'En vivo', fecha: new Date() });
            }
        });

        // 3. Si encontramos algo, guardamos
        if (nuevosPartidos.length > 0) {
            const batch = db.batch();
            nuevosPartidos.forEach(p => batch.set(coleccion.doc(), p));
            await batch.commit();
        }

        return res.status(200).json({ success: true, count: nuevosPartidos.length, data: nuevosPartidos });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
