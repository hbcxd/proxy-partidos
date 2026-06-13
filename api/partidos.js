const admin = require('firebase-admin');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Verificamos e inicializamos Firebase de manera segura
    if (!admin.apps.length) {
      let serviceAccount;
      
      // Si estamos en Vercel, usamos la variable. Si no, usamos el archivo local.
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (parseError) {
          throw new Error("La variable FIREBASE_SERVICE_ACCOUNT tiene un error de formato. Revisa que copiaste el JSON completo.");
        }
      } else {
        try {
          serviceAccount = require('../firebase-key.json');
        } catch (fileError) {
          throw new Error("No se encontró la variable de entorno en Vercel ni el archivo local.");
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();

    const partidoPrueba = {
      local: "Magallanes",
      visitante: "Leones",
      marcador: "3 - 1",
      fecha: new Date().toISOString()
    };

    const respuestaDb = await db.collection('partidos').add(partidoPrueba);

    res.status(200).json({ 
        success: true, 
        message: "¡Conexión exitosa y segura! Dato guardado en Firestore.",
        id_documento: respuestaDb.id 
    });

  } catch (error) {
    // Si algo sale mal, ahora lo veremos clarito en la web
    res.status(500).json({ 
        success: false, 
        message: 'Error interno de configuración', 
        detalles: error.message 
    });
  }
};