#!/usr/bin/env node
/**
 * scripts/wait-for-db.js — Pre-flight database readiness check
 *
 * 1. If Docker is available, ensures the postgres container is running
 * 2. Waits for the database port to accept TCP connections
 * 3. Exits 0 on success, 1 on failure with troubleshooting info
 *
 * Usage: node scripts/wait-for-db.js
 */
require('dotenv').config();
const net = require('net');
const { execSync } = require('child_process');
const path = require('path');
const { Sequelize } = require('sequelize');

const HOST = process.env.DB_HOST || '127.0.0.1';
const PORT = Number(process.env.DB_PORT || 5434);
const CONTAINER = 'asvo-qms-db';
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000;
const PROJECT_ROOT = path.resolve(__dirname, '..');

function log(msg) {
  console.log(`[wait-for-db] ${msg}`);
}

function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isContainerRunning() {
  try {
    const out = execSync(
      `docker inspect --format '{{.State.Running}}' ${CONTAINER}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    return out === 'true';
  } catch {
    return false;
  }
}

function startContainer() {
  log(`Container '${CONTAINER}' is not running. Starting...`);
  try {
    execSync('docker compose up -d postgres', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
    return true;
  } catch {
    try {
      execSync('docker-compose up -d postgres', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      });
      return true;
    } catch {
      return false;
    }
  }
}

function tryConnect() {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(800);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('error', () => { sock.destroy(); resolve(false); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.connect(PORT, HOST);
  });
}

async function main() {
  if (isDockerAvailable()) {
    if (!isContainerRunning()) {
      if (!startContainer()) {
        log('Could not start the database container. Start it manually:');
        log(`  cd ${PROJECT_ROOT} && docker compose up -d postgres`);
        process.exit(1);
      }
    }
  }

  log(`Waiting for database on ${HOST}:${PORT}...`);
  for (let i = 1; i <= MAX_RETRIES; i++) {
    if (await tryConnect()) {
      log(`Database is ready (attempt ${i}/${MAX_RETRIES}).`);

      // Verify Sequelize can authenticate (catches wrong/missing password early)
      const sequelize = new Sequelize(
        process.env.DB_NAME || 'asvo_qms',
        process.env.DB_USER || 'qms',
        process.env.DB_PASSWORD,
        {
          dialect: 'postgres',
          host: HOST,
          port: PORT,
          logging: false,
          dialectOptions: { connectionTimeoutMillis: 10000 },
        }
      );
      try {
        await sequelize.authenticate();
        log('Sequelize authentication OK.');
      } catch (err) {
        log(`TCP port is open, but Sequelize cannot connect: ${err.message}`);
        if (!process.env.DB_PASSWORD) {
          log('Hint: DB_PASSWORD is not set. Create a .env file (see .env.example).');
        }
        await sequelize.close();
        process.exit(1);
      }
      await sequelize.close();
      process.exit(0);
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
  }

  console.log('');
  log(`Could not connect to database at ${HOST}:${PORT} after ${MAX_RETRIES}s.`);
  log('');
  log('Troubleshooting:');
  log('  1. Check Docker is running:  docker info');
  log('  2. Check container status:   docker ps -a | grep ' + CONTAINER);
  log('  3. Check container logs:     docker logs ' + CONTAINER);
  log('  4. Start manually:           docker compose up -d postgres');
  process.exit(1);
}

main();
