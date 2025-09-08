
import { Router } from 'express';

const router = Router();

// Helper to send SSE messages
const sendSseMessage = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const runRealtimeTest = async (res, testConfig) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Send headers immediately

  const { url, method, body, numRequests } = testConfig;
  let completedRequests = 0;
  let failedRequests = 0;

  sendSseMessage(res, 'start', { totalRequests: numRequests });

  for (let i = 1; i <= numRequests; i++) {
    const startTime = Date.now();
    try {
      const fetchOptions = {
        method: method || 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      completedRequests++;
      sendSseMessage(res, 'result', {
        request: i,
        status: 'success',
        duration: `${duration}ms`,
        response: data,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      failedRequests++;
      sendSseMessage(res, 'result', {
        request: i,
        status: 'error',
        duration: `${duration}ms`,
        error: error.message,
      });
    }
  }

  sendSseMessage(res, 'end', {
    totalRequests: numRequests,
    completedRequests,
    failedRequests,
  });

  res.end(); // Close the connection
};

// SSE Load test for the /offers endpoint
router.get('/load-test-stream/offers', (req, res) => {
  if (process.env.TEST_MODE !== 'true') return res.status(404).send('Not Found');
  
  const testConfig = {
    url: 'http://localhost:3000/api/scraper/offers?maxPages=1',
    numRequests: 10, // Reduced for safer streaming
  };
  runRealtimeTest(res, testConfig);
});

// SSE Load test for the /search endpoint
router.get('/load-test-stream/search', (req, res) => {
  if (process.env.TEST_MODE !== 'true') return res.status(404).send('Not Found');
  
  const testConfig = {
    url: 'http://localhost:3000/api/scraper/search?q=laptop&maxPages=1',
    numRequests: 10,
  };
  runRealtimeTest(res, testConfig);
});

// SSE Load test for the /product endpoint
router.post('/load-test-stream/product', (req, res) => {
  if (process.env.TEST_MODE !== 'true') return res.status(404).send('Not Found');

  const testConfig = {
    url: 'http://localhost:3000/api/scraper/product',
    method: 'POST',
    body: {
      url: 'https://www.mercadolibre.com.ar/notebook-exo-smart-l37-gris-14-intel-celeron-n4020-4gb-de-ram-128gb-ssd-intel-uhd-graphics-600-1366x768px-windows-11-home/p/MLA22050834',
    },
    numRequests: 10,
  };
  runRealtimeTest(res, testConfig);
});

export default router;
