const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Project Schema
const Project = mongoose.model('Project', new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  tech:        [String],
  github:      String,
  live:        String,
  image:       String,
}, { timestamps: true }));

// Contact Schema
const Contact = mongoose.model('Contact', new mongoose.Schema({
  name: String, email: String, message: String,
}, { timestamps: true }));

// Seed
async function seed() {
  const count = await Project.countDocuments();
  if (count === 0) {
    await Project.insertMany([
      { title: 'E-Commerce Platform', description: 'Full-stack shopping app with cart, payments, and admin dashboard.', tech: ['React', 'Node.js', 'MongoDB', 'Stripe'], github: 'https://github.com', live: 'https://example.com', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop' },
      { title: 'Task Management App', description: 'Drag-and-drop kanban board with real-time collaboration.', tech: ['React', 'Express', 'Socket.io', 'PostgreSQL'], github: 'https://github.com', live: 'https://example.com', image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop' },
      { title: 'Weather Dashboard', description: 'Real-time weather forecasts with interactive charts and maps.', tech: ['JavaScript', 'OpenWeather API', 'Chart.js'], github: 'https://github.com', live: 'https://example.com', image: 'https://images.unsplash.com/photo-1504608524841-42584120d693?w=400&h=250&fit=crop' },
    ]);
    console.log('Seeded');
  }
}

// Routes
app.get('/', (req, res) => res.json({ status: 'API running' }));

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/contact', async (req, res) => {
  try {
    await Contact.create(req.body);
    res.status(201).json({ message: 'Message received!' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Start
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seed();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB error:', err.message);
    process.exit(1);
  });
