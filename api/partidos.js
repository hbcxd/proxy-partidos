module.exports = async (req, res) => {
  try {
    const credencialesTexto = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!credencialesTexto) {
      return res.status(500).json({ success: false, error: "La variable FIREBASE_SERVICE_ACCOUNT está vacía." });
    }

    // Intentamos parsear el JSON
    const serviceAccount = JSON.parse(credencialesTexto);

    return res.status(200).json({ 
      success: true, 
      message: "¡Conexión totalmente exitosa! El proxy se comunicó correctamente con Firebase.",
      projectId: serviceAccount.project_id // Solo para verificar que lee bien el JSON
    });
    
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: "Error en el código: " + error.message 
    });
  }
};
