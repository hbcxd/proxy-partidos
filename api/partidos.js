const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicialización segura con la API moderna de Firebase
if (getApps().length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error("Error al leer las credenciales:", error);
  }
}

const db = getFirestore();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const partidoPrueba = {
      local: "Navegantes del Magallanes",
      visitante: "Leones del Caracas",
      marcador: "0 - 0",
      estado: "Por iniciar",
      fecha: new Date().toISOString()
    };

    const respuestaDb = await db.collection('partidos').add(partidoPrueba);

    res.status(200).json({ 
        success: true, 
        message: "¡Proxy configurado con la nueva versión! Dato guardado.",
        id_documento: respuestaDb.id 
    });

  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: 'Error al conectar con la base de datos', 
        detalles: error.message 
    });
  }
};