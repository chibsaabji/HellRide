const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');
const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
const LEADS_FILE = path.join(__dirname, 'data', 'leads.json');
const WISHLIST_FILE = path.join(__dirname, 'data', 'wishlists.json');
const SECRET_KEY = 'super_secret_antigravity_key_123';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the dist directory (frontend build)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the Inventory directory for user-uploaded images, so they aren't lost on rebuild
app.use('/Inventory', express.static(path.join(__dirname, 'Inventory')));

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};

// --- ADMIN ACCOUNT HELPERS ---
const getStaffAccounts = () => {
  try {
    const data = fs.readFileSync(ADMIN_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [parsed];
    return parsed;
  } catch (err) {
    return [{ username: 'admin', password: 'antigravity2026', role: 'admin' }];
  }
};

const saveStaffAccounts = (accounts) => {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(accounts, null, 2));
};

// --- LEADS HELPERS ---
const getLeads = () => {
  try {
    if (!fs.existsSync(LEADS_FILE)) return [];
    const data = fs.readFileSync(LEADS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) { return []; }
};

const saveLeads = (data) => {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(data, null, 2));
};

// --- LOGIN ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const accounts = getStaffAccounts();
  const account = accounts.find(a => a.username === username && a.password === password);
  if (account) {
    const token = jwt.sign({ username: account.username, role: 'admin' }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

app.post('/api/google-login', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Auth code is required' });
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Google token exchange failed:', tokenData);
      return res.status(401).json({ message: 'Invalid Google auth code' });
    }
    const profileResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenData.access_token}`);
    const profileData = await profileResponse.json();
    if (!profileResponse.ok || !profileData.email) {
      return res.status(401).json({ message: 'Failed to fetch Google profile' });
    }
    const jwtToken = jwt.sign({ username: profileData.email, role: 'user', googleAuth: true }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token: jwtToken, user: { name: profileData.name, email: profileData.email, picture: profileData.picture } });
  } catch (error) {
    console.error('Server error during Google auth:', error);
    res.status(500).json({ message: 'Server error during Google auth' });
  }
});

// --- CHANGE PASSWORD ---
app.post('/api/change-password', authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const accounts = getStaffAccounts();
  const idx = accounts.findIndex(a => a.username === req.user.username);
  if (idx === -1 || accounts[idx].password !== currentPassword) {
    return res.status(401).json({ message: 'Incorrect current password' });
  }
  accounts[idx].password = newPassword;
  saveStaffAccounts(accounts);
  res.json({ message: 'Password updated successfully' });
});

// --- STAFF MANAGEMENT ---
app.get('/api/staff', authenticateAdmin, (req, res) => {
  const accounts = getStaffAccounts();
  const safe = accounts.map(a => ({ username: a.username, role: a.role || 'admin', createdAt: a.createdAt || '' }));
  res.json(safe);
});

app.post('/api/staff', authenticateAdmin, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const accounts = getStaffAccounts();
  if (accounts.find(a => a.username === username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  const newAccount = {
    username,
    password,
    role: 'admin',
    createdAt: new Date().toISOString().split('T')[0]
  };
  accounts.push(newAccount);
  saveStaffAccounts(accounts);
  res.status(201).json({ message: 'Staff account created', username });
});

app.delete('/api/staff/:username', authenticateAdmin, (req, res) => {
  const { username } = req.params;
  if (username === req.user.username) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }
  let accounts = getStaffAccounts();
  const before = accounts.length;
  accounts = accounts.filter(a => a.username !== username);
  if (accounts.length === before) {
    return res.status(404).json({ message: 'Account not found' });
  }
  saveStaffAccounts(accounts);
  res.json({ message: 'Account deleted' });
});

// --- LEADS ---
app.post('/api/leads', (req, res) => {
  const { name, phone, email, model, date, time } = req.body;
  if (!name || !phone || !email || !model) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const leads = getLeads();
  const lead = {
    id: Date.now().toString(),
    name, phone, email, model, date, time,
    submittedAt: new Date().toISOString(),
    status: 'new'
  };
  leads.push(lead);
  saveLeads(leads);
  res.status(201).json({ message: 'Lead submitted successfully', lead });
});

app.get('/api/leads', authenticateAdmin, (req, res) => {
  const leads = getLeads();
  res.json(leads.reverse());
});

app.delete('/api/leads/:id', authenticateAdmin, (req, res) => {
  let leads = getLeads();
  leads = leads.filter(l => l.id !== req.params.id);
  saveLeads(leads);
  res.json({ message: 'Lead deleted' });
});

// --- INVENTORY HELPERS ---
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) { return []; }
};
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- WISHLIST HELPERS ---
const getWishlists = () => {
  try {
    if (!fs.existsSync(WISHLIST_FILE)) return {};
    const data = fs.readFileSync(WISHLIST_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) { return {}; }
};
const saveWishlists = (data) => {
  fs.writeFileSync(WISHLIST_FILE, JSON.stringify(data, null, 2));
};

// --- UPLOAD ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'Inventory');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ storage: storage });

app.post('/api/upload', authenticateAdmin, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const paths = req.files.map(file => `./Inventory/${file.filename}`);
  res.json({ paths });
});

// --- INVENTORY CRUD ---
app.get('/api/inventory', (req, res) => res.json(readData()));

app.get('/api/inventory/:id', (req, res) => {
  const car = readData().find(c => String(c.id) === String(req.params.id));
  car ? res.json(car) : res.status(404).json({ message: 'Car not found' });
});

app.post('/api/inventory', authenticateAdmin, (req, res) => {
  const inventory = readData();
  const newCar = { id: Date.now().toString(), ...req.body };
  inventory.push(newCar);
  writeData(inventory);
  res.status(201).json(newCar);
});

app.delete('/api/inventory/:id', authenticateAdmin, (req, res) => {
  let inventory = readData();
  const before = inventory.length;
  inventory = inventory.filter(car => car.id !== req.params.id);
  if (inventory.length === before) return res.status(404).json({ message: 'Car not found' });
  writeData(inventory);
  res.status(200).json({ message: 'Deleted successfully' });
});

app.put('/api/inventory/:id', authenticateAdmin, (req, res) => {
  let inventory = readData();
  const id = req.params.id;
  const index = inventory.findIndex(car => car.id === id);
  if (index === -1) return res.status(404).json({ message: 'Car not found' });
  inventory[index] = { ...inventory[index], ...req.body, id };
  writeData(inventory);
  res.status(200).json(inventory[index]);
});

// --- WISHLIST API ---
app.get('/api/wishlist', authenticateToken, (req, res) => {
  const wishlists = getWishlists();
  res.json(wishlists[req.user.username] || []);
});

app.post('/api/wishlist/:id', authenticateToken, (req, res) => {
  const wishlists = getWishlists();
  const carId = req.params.id;
  const username = req.user.username;
  if (!wishlists[username]) wishlists[username] = [];
  const index = wishlists[username].indexOf(carId);
  if (index === -1) {
    wishlists[username].push(carId);
  } else {
    wishlists[username].splice(index, 1);
  }
  saveWishlists(wishlists);
  res.json({ wishlist: wishlists[username] });
});

// For multipage setup fallback (serve the HTML pages based on path)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  
  const reqPath = req.path;
  const distPath = path.join(__dirname, 'dist');
  
  if (reqPath.endsWith('.html')) {
    const filePath = path.join(distPath, reqPath);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  } else {
    // If asking for /admin, serve /admin.html etc.
    const htmlFile = path.join(distPath, `${reqPath}.html`);
    if (fs.existsSync(htmlFile)) {
      return res.sendFile(htmlFile);
    }
  }
  
  // Default to index.html if file not found and not an API request
  if (!reqPath.startsWith('/api/')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  next();
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
