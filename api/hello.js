export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Node.js! API is working!',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    working: true,
    fixed: 'Files restored successfully!'
  });
} 