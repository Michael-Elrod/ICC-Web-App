import mysql from 'mysql2/promise';

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  throw new Error('Database configuration not found');
}

declare global {
  var mysqlPool: mysql.Pool | undefined;
}

// Create connection URL string
const connectionUrl = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}?ssl=true`;

const pool = global.mysqlPool || mysql.createPool(connectionUrl);

// Keep the connection testing logic
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err.message);
    throw err;
  });

// Keep the development mode caching
if (process.env.NODE_ENV !== 'production') {
  global.mysqlPool = pool;
}

export default pool;