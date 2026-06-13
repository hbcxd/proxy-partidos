const admin = require('firebase-admin');

// 1. Inicialización de Firebase leyendo la variable de Vercel
if (!admin.apps.length) {
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
  // Permisos para que cualquier página pueda consultar esta API
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Creamos un dato de prueba
    const partidoPrueba = {
      local: "Magallanes",
      visitante: "Leones",
      marcador: "0 - 0",
      estado: "Por iniciar",
      fecha: new Date().toISOString()
    };

    // Lo enviamos a la colección 'partidos' en tu base de datos
    const respuestaDb = await db.collection('partidos').add(partidoPrueba);

    // Respuesta de éxito en pantalla
    res.status(200).json({ 
        success: true, 
        message: "¡Proxy configurado desde cero con éxito! Dato guardado.",
        id_documento: respuestaDb.id 
    });

  } catch (error) {
    // Si falla, mostramos el error exacto
    res.status(500).json({ 
        success: false, 
        message: 'Error al conectar con la base de datos', 
        detalles: error.message 
    });
  }
};
