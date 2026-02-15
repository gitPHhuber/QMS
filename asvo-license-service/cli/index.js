#!/usr/bin/env node

const { Command } = require('commander');
const { keygen } = require('./src/keygen');
const { createLicense } = require('./src/license-create');
const { verifyLicense } = require('./src/license-verify');

const program = new Command();

program
  .name('als-cli')
  .description('ASVO License Service CLI — generate keys, create and verify licenses')
  .version('1.0.0');

program
  .command('keygen')
  .description('Generate Ed25519 keypair for license signing')
  .option('-o, --output <dir>', 'Output directory', './keys')
  .action((opts) => {
    keygen(opts.output);
  });

program
  .command('create')
  .description('Create a signed license')
  .requiredOption('-k, --key <path>', 'Path to private.key')
  .requiredOption('--org <name>', 'Organization name')
  .requiredOption('--tier <tier>', 'Tier: start|standard|pro|industry|corp')
  .requiredOption('--modules <list>', 'Comma-separated module list', (v) => v.split(','))
  .requiredOption('--max-users <n>', 'Max users', parseInt)
  .requiredOption('--max-storage <n>', 'Max storage GB', parseInt)
  .option('--duration <days>', 'License duration in days', parseInt, 365)
  .option('--fingerprint <fp>', 'Hardware fingerprint')
  .option('--grace-days <n>', 'Grace period days', parseInt, 14)
  .option('-o, --output <path>', 'Output .lic file path')
  .action((opts) => {
    const token = createLicense({
      privateKeyPath: opts.key,
      org: opts.org,
      tier: opts.tier,
      modules: opts.modules,
      maxUsers: opts.maxUsers,
      maxStorageGb: opts.maxStorage,
      durationDays: opts.duration,
      fingerprint: opts.fingerprint,
      graceDays: opts.graceDays,
      output: opts.output,
    });
    if (!opts.output) {
      console.log('\nLicense token:');
      console.log(token);
    }
  });

program
  .command('verify')
  .description('Verify a license token or file')
  .requiredOption('-k, --key <path>', 'Path to public.key')
  .option('-t, --token <token>', 'License token string')
  .option('-f, --file <path>', 'Path to .lic file')
  .action((opts) => {
    const result = verifyLicense({
      publicKeyPath: opts.key,
      token: opts.token,
      file: opts.file,
    });
    if (result.valid) {
      console.log('License is VALID');
      if (result.inGrace) {
        console.log('  WARNING: License expired, in grace period');
      }
      console.log('\nPayload:');
      console.log(JSON.stringify(result.payload, null, 2));
    } else {
      console.error('License is INVALID');
      console.error(`  Error: ${result.error}`);
    }
  });

program.parse();
