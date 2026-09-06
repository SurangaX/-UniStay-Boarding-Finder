export function createVercelHandler(netlifyHandler) {
  return async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    try {
      const event = {
        httpMethod: req.method,
        headers: req.headers || {},
        queryStringParameters: req.query || {},
        body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
      };

      const result = await netlifyHandler(event);

      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      const statusCode = result.statusCode || 200;
      const responseBody = result.body !== undefined ? result.body : '';

      res.status(statusCode);

      try {
        const parsed = JSON.parse(responseBody);
        return res.json(parsed);
      } catch {
        return res.send(responseBody);
      }
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  };
}
