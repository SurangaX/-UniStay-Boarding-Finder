export const handler = async (event) => {
  const query = event.queryStringParameters.query;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Query parameter is required' }),
    };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=lk&limit=5`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UniStayPortal/1.0 (https://unistaylk.netlify.app)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Enable CORS for the frontend
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400'
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Places API Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch places' }),
    };
  }
};
