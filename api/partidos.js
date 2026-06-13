const admin = require('firebase-admin');

// 1. Inicialización ultra-segura para evitar el error de "length"
if (!admin.apps || admin.apps.length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Error al leer las credenciales:", error);
  }
}

const db = admin.firestore();

// 2. Lógica de la API
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
        message: "¡Proxy configurado con éxito! Dato guardado en la base de datos.",
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
