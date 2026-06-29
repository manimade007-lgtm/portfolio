const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null };

async function connect() {
  if (cached.conn) return cached.conn;
  cached.conn = await mongoose.connect(process.env.MONGO_URI);
  return cached.conn;
}

const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({
  title: String, description: String, tech: [String],
  github: String, live: String, image: String,
}, { timestamps: true }));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connect();

  if (req.method === 'DELETE') {
    await Project.findByIdAndDelete(req.query.id);
    return res.json({ message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
