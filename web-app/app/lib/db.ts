// app/lib/db.ts
import mysql from 'mysql2/promise';

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  throw new Error('Database configuration not found');
}

declare global {
  var mysqlPool: mysql.Pool | undefined;
}

const pool = global.mysqlPool || mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

if (process.env.NODE_ENV === 'development') {
  global.mysqlPool = pool;
}

export default pool;