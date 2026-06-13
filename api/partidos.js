const admin = require('firebase-admin');

// Llamamos a tu llave privada (Asegúrate de que el nombre del archivo sea exacto)
const serviceAccount = require('../firebase-key.json');

// Iniciamos la conexión con Firebase de manera segura
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Aquí es donde uniremos el Scraper más adelante.
    // Por ahora, vamos a insertar un partido de prueba para confirmar la conexión.
    const partidoPrueba = {
      local: "Magallanes",
      visitante: "Leones",
      marcador: "3 - 1",
      fecha: new Date().toISOString()
    };

    // Apuntamos a tu colección "partidos" y añadimos el documento
    const respuestaDb = await db.collection('partidos').add(partidoPrueba);

    res.status(200).json({ 
        success: true, 
        message: "¡Conexión exitosa! Dato guardado en Firestore.",
        id_documento: respuestaDb.id 
    });

  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: 'Error al conectar con la base de datos', 
        error: error.message 
    });
  }
};
