const axios = require('axios');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const db = getFirestore();

    try {
        // Usaremos una API gratuita de datos abiertos (ejemplo de estructura)
        // Nota: Para este ejemplo, simularemos la llamada a una API pública de deportes
        const response = await axios.get('https://api.football-data.org/v4/matches', {
            headers: { 'X-Auth-Token': 'TU_API_KEY_AQUI' } // Aquí pondrías la llave que te dan gratis
        });

        const partidos = response.data.matches.map(m => ({
            local: m.homeTeam.name,
            visitante: m.awayTeam.name,
            marcador: `${m.score.fullTime.home} - ${m.score.fullTime.away}`
        }));

        // Guardamos en Firebase
        const batch = db.batch();
        partidos.forEach(p => batch.set(db.collection('partidos_en_vivo').doc(), p));
        await batch.commit();

        return res.status(200).json({ success: true, data: partidos });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Necesitamos configurar una API Key gratuita para obtener datos reales." });
    }
};
