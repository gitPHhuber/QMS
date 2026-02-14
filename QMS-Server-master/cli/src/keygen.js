/**
 * als-cli keygen — generate Ed25519 keypair for license signing.
 */

const fs = require('fs');
const path = require('path');
const { generateKeypair, encodeKey } = require('./crypto');

function keygen(options) {
  const outputDir = options.output || './keys';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const kp = generateKeypair();

  const privatePath = path.join(outputDir, 'private.key');
  const publicPath = path.join(outputDir, 'public.key');

  fs.writeFileSync(privatePath, encodeKey(kp.secretKey), 'utf-8');
  fs.writeFileSync(publicPath, encodeKey(kp.publicKey), 'utf-8');

  console.log('Ed25519 keypair generated:');
  console.log(`  Private key: ${privatePath} (KEEP SECRET)`);
  console.log(`  Public key:  ${publicPath} (embed in QMS client)`);
  console.log('');
  console.log(`Public key (base64): ${encodeKey(kp.publicKey)}`);
}

module.exports = keygen;
