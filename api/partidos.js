const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Probemos con una URL diferente que suele ser más abierta:
    const url = 'https://www.marca.com/futbol/resultados.html'; 
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    let resultados = [];

    // NOTA: Cada web tiene su propia estructura. 
    // Aquí, por ejemplo, estamos buscando un selector genérico.
    // Si la web no tiene datos, "resultados" estará vacío.
    $('.match-item').each((i, el) => {
      resultados.push({
        local: $(el).find('.team-a').text().trim(),
        visitante: $(el).find('.team-b').text().trim()
      });
    });

    res.status(200).json({ success: true, count: resultados.length, data: resultados });

  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: 'Error en la petición', 
        error: error.message,
        // Si el error es 403, es bloqueo. Si es 404, la URL no existe.
        status: error.response ? error.response.status : 'No response'
    });
  }
};
