export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.OUTSCRAPER_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OUTSCRAPER_KEY not configured' });

  const { query, limit, rating, language, region } = req.query;

  if (!query) return res.status(400).json({ error: 'query parameter required' });

  try {
    const params = new URLSearchParams({
      query: query,
      limit: limit || 200,
      rating: rating || 3.5,
      'enrichment[]': 'emails_validator',
      language: language || 'en',
      region: region || 'us',
      async: false,
    });

    const response = await fetch(
      `https://api.app.outscraper.com/maps/search-v3?${params.toString()}`,
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    
    // Outscraper returns { data: [[...results]] } or { data: [...results] }
    let results = [];
    if (data.data) {
      results = Array.isArray(data.data[0]) ? data.data[0] : data.data;
    } else if (Array.isArray(data)) {
      results = data;
    }

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
