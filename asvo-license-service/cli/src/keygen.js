const fs = require('fs');
const path = require('path');
const { generateKeyPair, encodeBase64url } = require('./crypto');

/**
 * Generate Ed25519 keypair and save to files
 * @param {string} outputDir - Directory to save keys
 */
function keygen(outputDir) {
  const absDir = path.resolve(outputDir);
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }

  const keyPair = generateKeyPair();

  const privatePath = path.join(absDir, 'private.key');
  const publicPath = path.join(absDir, 'public.key');

  fs.writeFileSync(privatePath, encodeBase64url(keyPair.secretKey), 'utf8');
  fs.writeFileSync(publicPath, encodeBase64url(keyPair.publicKey), 'utf8');

  console.log(`Keys generated:`);
  console.log(`  Private: ${privatePath}`);
  console.log(`  Public:  ${publicPath}`);
  console.log(`\nPublic key (base64url): ${encodeBase64url(keyPair.publicKey)}`);
}

module.exports = { keygen };
