import { db, seedIfEmpty, getDbPath } from './database.js';

db.exec('DELETE FROM chat_messages;');
db.exec('DELETE FROM alerts;');
db.exec('DELETE FROM soil_readings;');
db.exec('DELETE FROM devices;');
db.exec('DELETE FROM farms;');

seedIfEmpty();
console.log(`✅ Database reset and seeded at: ${getDbPath()}`);
