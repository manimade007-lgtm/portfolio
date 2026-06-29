const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null };

async function connect() {
  if (cached.conn) return cached.conn;
  cached.conn = await mongoose.connect(MONGO_URI);
  return cached.conn;
}

const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  tech:        [String],
  github:      String,
  live:        String,
  image:       String,
}, { timestamps: true }));

async function seed() {
  const count = await Project.countDocuments();
  if (count === 0) {
    await Project.insertMany([
      { title: 'E-Commerce Platform', description: 'Full-stack shopping app with cart, payments, and admin dashboard.', tech: ['React', 'Node.js', 'MongoDB', 'Stripe'], github: 'https://github.com', live: 'https://example.com', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop' },
      { title: 'Task Management App', description: 'Drag-and-drop kanban board with real-time collaboration.', tech: ['React', 'Express', 'Socket.io', 'PostgreSQL'], github: 'https://github.com', live: 'https://example.com', image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop' },
      { title: 'Weather Dashboard', description: 'Real-time weather forecasts with interactive charts and maps.', tech: ['JavaScript', 'OpenWeather API', 'Chart.js'], github: 'https://github.com', live: 'https://example.com', image: 'https://images.unsplash.com/photo-1504608524841-42584120d693?w=400&h=250&fit=crop' },
    ]);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connect();

  if (req.method === 'GET') {
    await seed();
    const projects = await Project.find().sort({ createdAt: -1 });
    return res.json(projects);
  }

  if (req.method === 'POST') {
    const project = await Project.create(req.body);
    return res.status(201).json(project);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
