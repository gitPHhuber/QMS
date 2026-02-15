require('dotenv').config();
const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
    process.env.DB_NAME || 'asvo_qms',
    process.env.DB_USER || 'qms',
    process.env.DB_PASSWORD,
    {
        dialect: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5434),
        logging: false,
        dialectOptions: {
            connectTimeoutMS: 10000,
            connectionTimeoutMillis: 10000,
        },
    }
);