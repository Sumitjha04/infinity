const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 8000;

const DATA_DIR = path.join(__dirname, "data");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(REGISTRATIONS_FILE)) {
  fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify([]));
}

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

function readRegistrations() {
  try {
    const raw = fs.readFileSync(REGISTRATIONS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error("Error reading registrations:", err);
  }
  return [];
}

function writeRegistrations(list) {
  try {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing registrations:", err);
  }
}

app.post("/api/register", (req, res) => {
  const { name, email, event, seats } = req.body || {};

  if (!name || !email || !event) {
    return res.status(400).json({ ok: false, message: "Missing required fields." });
  }

  const seatsNum = Number.parseInt(seats, 10) || 1;
  const createdAt = new Date().toISOString();

  const registrations = readRegistrations();
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    event,
    seats: seatsNum,
    createdAt
  };

  registrations.push(record);
  writeRegistrations(registrations);

  res.json({
    ok: true,
    message: "Registration saved successfully. We will share Paytm payment details with you soon.",
    registration: record
  });
});

app.get("/api/registrations", (req, res) => {
  const registrations = readRegistrations();
  res.json({ ok: true, registrations });
});

app.listen(PORT, () => {
  console.log(`Infinity backend running at http://localhost:${PORT}`);
});

