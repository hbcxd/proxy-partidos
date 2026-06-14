const axios = require('axios');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const db = getFirestore();
    const coleccion = db.collection('partidos_en_vivo');

    try {
        const token = process.env.API_TOKEN;
        if (!token) throw new Error("API_TOKEN no configurado en Vercel");

        const response = await axios.get('https://api.football-data.org/v4/matches', {
            headers: { 'X-Auth-Token': token }
        });

        const partidos = response.data.matches.map(m => ({
            local: m.homeTeam.name,
            visitante: m.awayTeam.name,
            marcador: `${m.score.fullTime.home ?? 0} - ${m.score.fullTime.away ?? 0}`,
            ultimaActualizacion: new Date().toISOString()
        }));

        const batch = db.batch();
        const snapshot = await coleccion.get();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        partidos.forEach(p => batch.set(coleccion.doc(), p));
        await batch.commit();

        return res.status(200).json({ success: true, total: partidos.length, data: partidos });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
