import express from 'express';
import cors from 'cors';

console.log('🚀 Testing basic Express setup...');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server working' });
});

const PORT = process.env.SERVER_PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});
