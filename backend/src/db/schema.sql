-- Root Sense Relational Database Schema (SQLite / PostgreSQL compatible)

CREATE TABLE IF NOT EXISTS farms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude REAL NOT NULL DEFAULT 13.3379,
  longitude REAL NOT NULL DEFAULT 77.1173,
  crop_type TEXT NOT NULL DEFAULT 'Ragi',
  soil_type TEXT NOT NULL DEFAULT 'Red Loam',
  growth_stage TEXT NOT NULL DEFAULT 'Vegetative',
  field_dimension REAL NOT NULL DEFAULT 2.5,
  field_unit TEXT NOT NULL DEFAULT 'Acres',
  irrigation_type TEXT NOT NULL DEFAULT 'Drip',
  sowing_date TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  appearance TEXT NOT NULL DEFAULT 'light',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id INTEGER NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  wifi_ssid TEXT DEFAULT 'Farm_WiFi',
  status TEXT NOT NULL DEFAULT 'Online',
  signal_dbm INTEGER NOT NULL DEFAULT -62,
  battery_pct INTEGER NOT NULL DEFAULT 94,
  last_sync_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS soil_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  moisture REAL,
  soil_temp REAL,
  humidity REAL,
  water_level REAL,
  water_level_cm REAL,
  nitrogen REAL,
  phosphorus REAL,
  potassium REAL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_soil_readings_farm_time
  ON soil_readings (farm_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  params_json TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_farm_time
  ON alerts (farm_id, created_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id INTEGER NOT NULL,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_farm_time
  ON chat_messages (farm_id, id ASC);

-- Compatibility view so any client or script querying sensor_readings
-- queries soil_readings seamlessly from the unified database
CREATE VIEW IF NOT EXISTS sensor_readings AS
SELECT 
  id,
  farm_id,
  device_id,
  soil_temp AS temperature,
  humidity,
  moisture AS soil_moisture,
  water_level,
  water_level_cm,
  nitrogen,
  phosphorus,
  potassium,
  timestamp AS recorded_at
FROM soil_readings;

