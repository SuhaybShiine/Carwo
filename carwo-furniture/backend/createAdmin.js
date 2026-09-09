require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function run() {
  const hash = await bcrypt.hash('admin123', 10);
  await db.query(
    `INSERT INTO Users (Username, Password, Full_Name, Role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE Password = VALUES(Password), Role = 'admin'`,
    ['admin', hash, 'System Admin', 'admin']
  );
  console.log('Admin created: username=admin  password=admin123');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});