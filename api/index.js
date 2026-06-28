const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
}

const projectSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  tech:        [String],
  github:      String,
  live:        String,
  image:       String,
}, { timestamps: true });
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

const contactSchema = new mongoose.Schema({
  name: String, email: String, message: String,
}, { timestamps: true });
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

async function seedProjects() {
  const count = await Project.countDocuments();
  if (count === 0) {
    await Project.insertMany([
      {
        title: 'E-Commerce Platform',
        description: 'Full-stack shopping app with cart, payments, and admin dashboard.',
        tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        github: 'https://github.com',
        live: 'https://example.com',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
      },
      {
        title: 'Task Management App',
        description: 'Drag-and-drop kanban board with real-time collaboration.',
        tech: ['React', 'Express', 'Socket.io', 'PostgreSQL'],
        github: 'https://github.com',
        live: 'https://example.com',
        image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop',
      },
      {
        title: 'Weather Dashboard',
        description: 'Real-time weather forecasts with interactive charts and maps.',
        tech: ['JavaScript', 'OpenWeather API', 'Chart.js'],
        github: 'https://github.com',
        live: 'https://example.com',
        image: 'https://images.unsplash.com/photo-1504608524841-42584120d693?w=400&h=250&fit=crop',
      },
    ]);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  const url = req.url;

  // GET /api/projects
  if (req.method === 'GET' && url.includes('/api/projects') && !url.includes('/api/projects/')) {
    await seedProjects();
    const projects = await Project.find().sort({ createdAt: -1 });
    return res.json(projects);
  }

  // POST /api/projects
  if (req.method === 'POST' && url.includes('/api/projects')) {
    const project = await Project.create(req.body);
    return res.status(201).json(project);
  }

  // DELETE /api/projects/:id
  if (req.method === 'DELETE' && url.includes('/api/projects/')) {
    const id = url.split('/api/projects/')[1];
    await Project.findByIdAndDelete(id);
    return res.json({ message: 'Deleted' });
  }

  // POST /api/contact
  if (req.method === 'POST' && url.includes('/api/contact')) {
    await Contact.create(req.body);
    return res.status(201).json({ message: 'Message received!' });
  }

  return res.status(404).json({ error: 'Not found' });
}
