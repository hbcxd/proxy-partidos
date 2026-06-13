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
        // 1. Intentar obtener de Cache (Firebase)
        const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
        const snapshot = await coleccion.where('ultimaActualizacion', '>', Timestamp.fromDate(cincoMinutosAtras)).limit(1).get();

        if (!snapshot.empty) {
            const partidos = snapshot.docs.map(doc => doc.data());
            return res.status(200).json({ success: true, fuente: 'Cache', data: partidos });
        }

        // 2. Intentar obtener de varias fuentes (Estrategia Multi-Fuente)
        const fuentes = [
            { nombre: 'Besoccer', url: 'https://www.besoccer.com/livescore' },
            { nombre: 'Flashscore', url: 'https://www.flashscore.com/' }
        ];

        let datosEncontrados = [];

        for (let fuente of fuentes) {
            try {
                const { data } = await axios.get(fuente.url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' }});
                const $ = cheerio.load(data);
                
                // Lógica simplificada para encontrar cualquier elemento de partido
                $('.match, .event__match').each((i, el) => {
                    const local = $(el).find('.home, .event__participant--home').text().trim();
                    const visit = $(el).find('.away, .event__participant--away').text().trim();
                    if (local && visit) {
                        datosEncontrados.push({ local, visit, fuente: fuente.nombre, fecha: new Date() });
                    }
                });

                if (datosEncontrados.length > 0) break; // Si encontramos algo, paramos de buscar
            } catch (e) { continue; } // Si una falla, sigue con la siguiente
        }

        // 3. Guardar y responder
        if (datosEncontrados.length > 0) {
            const batch = db.batch();
            datosEncontrados.forEach(p => batch.set(coleccion.doc(p.local + p.visit), p));
            await batch.commit();
        }

        return res.status(200).json({ success: true, fuente: 'Scraping Multi-Fuente', data: datosEncontrados });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
