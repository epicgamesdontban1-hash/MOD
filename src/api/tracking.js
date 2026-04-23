const express = require('express');
const router = express.Router();

// In-memory store (persists via JSON file)
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/packages.json');

function loadPackages() {
  try {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
      return {};
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    console.error('Error loading packages:', e.message);
    return {};
  }
}

function savePackages(packages) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(packages, null, 2));
  } catch (e) {
    console.error('Error saving packages:', e.message);
  }
}

function getPackages() {
  return loadPackages();
}

function getPackage(id) {
  const packages = loadPackages();
  return packages[id.toUpperCase()] || null;
}

function createPackage(data) {
  const packages = loadPackages();
  const id = data.id || generateId();
  packages[id] = data;
  savePackages(packages);
  return packages[id];
}

function updatePackage(id, updates) {
  const packages = loadPackages();
  if (!packages[id.toUpperCase()]) return null;
  packages[id.toUpperCase()] = { ...packages[id.toUpperCase()], ...updates };
  savePackages(packages);
  return packages[id.toUpperCase()];
}

function addTimelineEvent(id, event) {
  const packages = loadPackages();
  const pkg = packages[id.toUpperCase()];
  if (!pkg) return null;
  pkg.timeline = pkg.timeline || [];
  pkg.timeline.push(event);
  savePackages(packages);
  return pkg;
}

function generateId() {
  const year = new Date().getFullYear();
  const packages = loadPackages();
  const count = Object.keys(packages).length + 1;
  return `MOD-${year}-${String(count).padStart(4, '0')}`;
}

// Export functions for bot use
module.exports = router;
module.exports.getPackages = getPackages;
module.exports.getPackage = getPackage;
module.exports.createPackage = createPackage;
module.exports.updatePackage = updatePackage;
module.exports.addTimelineEvent = addTimelineEvent;
module.exports.generateId = generateId;
module.exports.loadPackages = loadPackages;

// ===== API ROUTES =====

// GET - Track a single package (public)
router.get('/:id', (req, res) => {
  const pkg = getPackage(req.params.id);
  if (!pkg) {
    return res.status(404).json({
      success: false,
      message: `Package not found. Beertjie is still searching! 🐾`
    });
  }
  res.json({ success: true, package: pkg });
});

// GET - All packages (owner use)
router.get('/', (req, res) => {
  const packages = getPackages();
  res.json({ success: true, packages, total: Object.keys(packages).length });
});
