const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // URL de ejemplo (puedes cambiarla por la web que quieras scrapear)
    const url = 'https://www.resultados-futbol.com/vivo';
    
    // Hacemos la petición con headers para no parecer un bot
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    let resultados = [];

    // OJO: Aquí debes cambiar '.partido', '.local', etc., por las clases reales de la web
    // Inspecciona la web objetivo con F12 en tu navegador para ver las clases correctas
    $('.partido').each((i, el) => {
      resultados.push({
        local: $(el).find('.local').text().trim(),
        visitante: $(el).find('.visitante').text().trim(),
        marcador: $(el).find('.resultado').text().trim()
      });
    });

    res.status(200).json({ success: true, count: resultados.length, data: resultados });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};
