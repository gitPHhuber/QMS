require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'qms',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'asvo_qms',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5434),
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    // чтобы не висеть вечно при сетевых странностях
    connectionTimeoutMillis: 5000,
  },
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};
