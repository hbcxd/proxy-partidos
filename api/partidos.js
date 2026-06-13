const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // URL probada. Algunas páginas cambian su estructura, 
    // a veces debemos intentar con la página principal o una sección de resultados específica.
    const url = 'https://www.resultados-futbol.com/vivo';
    
    // Mejoramos los headers para parecer un navegador humano
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    });

    const $ = cheerio.load(data);
    let resultados = [];

    // Esta parte es la crítica. Si la página cambió su diseño, 
    // '.partido' ya no sirve y nos devolverá una lista vacía.
    // Intenta inspeccionar la web de nuevo y busca la clase que envuelve cada partido.
    $('.partido').each((i, el) => {
      const local = $(el).find('.local').text().trim();
      const visitante = $(el).find('.visitante').text().trim();
      
      if (local && visitante) {
        resultados.push({
          local: local,
          visitante: visitante,
          marcador: $(el).find('.resultado').text().trim()
        });
      }
    });

    res.status(200).json({ success: true, total: resultados.length, data: resultados });
  } catch (error) {
    // Si falla, enviamos el error exacto para saber qué pasó
    res.status(500).json({ 
        success: false, 
        message: 'Error en el servidor', 
        error: error.message,
        details: 'Probablemente la URL cambió o nos están bloqueando.'
    });
  }
};
