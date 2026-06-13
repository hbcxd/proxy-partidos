// Forzando actualizacion para produccion
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
  // Configuración de cabeceras seguras
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const credencialesTexto = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    // Diagnosticador 1: ¿La variable llega a Vercel?
    if (!credencialesTexto) {
      return res.status(500).json({
        success: false,
        error: "La variable FIREBASE_SERVICE_ACCOUNT no existe o está vacía en este entorno de Vercel."
      });
    }

    // Diagnosticador 2: ¿El formato del JSON es correcto?
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(credencialesTexto);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        error: "La variable existe en Vercel, pero no es un JSON válido. Hay un error de formato al copiarla.",
        detalle: parseError.message
      });
    }

    // Inicialización segura de Firebase
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }

    // Conexión a la base de datos
    const db = getFirestore();

    return res.status(200).json({
      success: true,
      message: "¡Conexión totalmente exitosa! El proxy se comunicó correctamente con Firebase."
    });

  } catch (errorGlobal) {
    return res.status(500).json({
      success: false,
      error: "Error inesperado en el servidor.",
      detalle: errorGlobal.message
    });
  }
};
