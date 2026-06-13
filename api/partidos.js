const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 1. Verificamos si ya existe una conexión (esto evita el error que te sale)
    if (getApps().length === 0) {
      const credencialesTexto = process.env.FIREBASE_SERVICE_ACCOUNT;
      const serviceAccount = JSON.parse(credencialesTexto);
      
      initializeApp({
        credential: cert(serviceAccount)
      });
    }

    // 2. Ahora que garantizamos la conexión, obtenemos Firestore
    const db = getFirestore();
    
    // 3. Prueba rápida: vamos a intentar leer una colección llamada 'prueba'
    // Esto confirmará si todo está bien conectado
    const snapshot = await db.collection('prueba').get();
    
    return res.status(200).json({ 
      success: true, 
      message: "¡Conexión y lectura exitosa!",
      documentosEncontrados: snapshot.size
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
