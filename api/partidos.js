const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
  // Configuración de cabeceras de seguridad para que cualquier web pueda consultarlo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Conexión a Firebase (ya sabemos que esto funciona perfecto)
    const credencialesTexto = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccount = JSON.parse(credencialesTexto);

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }

    const db = getFirestore();

    // 2. Extraer los partidos de la base de datos
    // Aquí le decimos que busque en la colección llamada 'partidos'
    const snapshot = await db.collection('partidos').get();
    const listaPartidos = [];

    // Recorremos cada documento y lo guardamos en nuestra lista
    snapshot.forEach((doc) => {
      listaPartidos.push({
        id: doc.id, // El código único del documento
        ...doc.data() // Los datos del partido (local, visitante, etc.)
      });
    });

    // 3. Enviar la lista de partidos a la pantalla
    return res.status(200).json({
      success: true,
      cantidad: listaPartidos.length,
      data: listaPartidos
    });

  } catch (errorGlobal) {
    return res.status(500).json({
      success: false,
      error: "Error al intentar leer los partidos.",
      detalle: errorGlobal.message
    });
  }
};
