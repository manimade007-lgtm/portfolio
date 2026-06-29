const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null };

async function connect() {
  if (cached.conn) return cached.conn;
  cached.conn = await mongoose.connect(process.env.MONGO_URI);
  return cached.conn;
}

const Contact = mongoose.models.Contact || mongoose.model('Contact', new mongoose.Schema({
  name: String, email: String, message: String,
}, { timestamps: true }));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connect();

  if (req.method === 'POST') {
    await Contact.create(req.body);
    return res.status(201).json({ message: 'Message received!' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
