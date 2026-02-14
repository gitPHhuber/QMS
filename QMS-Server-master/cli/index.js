#!/usr/bin/env node

/**
 * als-cli — ASVO License Service CLI
 *
 * Commands:
 *   keygen                    Generate Ed25519 keypair
 *   license create            Create signed license
 *   license verify            Verify .lic file
 */

const { program } = require('commander');

program
  .name('als-cli')
  .description('ASVO License Service CLI — generate and manage license keys')
  .version('1.0.0');

// ── keygen ──
program
  .command('keygen')
  .description('Generate Ed25519 keypair for license signing')
  .option('-o, --output <dir>', 'Output directory for keys', './keys')
  .action((options) => {
    const keygen = require('./src/keygen');
    keygen(options);
  });

// ── license ──
const license = program
  .command('license')
  .description('License management commands');

license
  .command('create')
  .description('Create a signed license key')
  .requiredOption('-k, --key <path>', 'Path to private.key')
  .requiredOption('-t, --tier <tier>', 'Tier: start|standard|pro|industry|corp')
  .option('--org <name>', 'Organization name/ID', 'unknown')
  .option('--inn <inn>', 'Organization INN')
  .option('--months <n>', 'Validity in months', '12')
  .option('--max-users <n>', 'Max users limit')
  .option('--storage-gb <n>', 'Max storage in GB')
  .option('--modules <list>', 'Comma-separated module codes (overrides tier)')
  .option('--fingerprint <hash>', 'Hardware fingerprint (sha256:...)')
  .option('--grace-days <n>', 'Grace period in days', '30')
  .option('-o, --output <path>', 'Output .lic file path')
  .action((options) => {
    const createLicense = require('./src/license-create');
    createLicense(options);
  });

license
  .command('verify')
  .description('Verify a license file')
  .requiredOption('-f, --file <path>', 'Path to .lic file')
  .requiredOption('-p, --pubkey <path>', 'Path to public.key')
  .action((options) => {
    const verify = require('./src/license-verify');
    verify(options);
  });

program.parse();
