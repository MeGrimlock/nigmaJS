const nigma = require('./build/js/nigma.min.js').default;
const { PolyalphabeticSolver } = nigma;
const Polyalphabetic = nigma.Polyalphabetic;

const ciphertext = "KQ SB'NC LICP RCNUXWMOD PNAEQ, NRCXMBBVV AUOKCB WRUJT GX UOMI LDEGP JUJMOD UTBR L NIXMIGUIB IEAH UD DRLWMVVHC CRNJ OIYEGPMLP CCKHCYQ DOR FFQ CCJNYPW WU CPH VEI SKR SFPF YOWXML.";

console.log('Testing Porta decryption with key "KEY"...');
const porta = new Polyalphabetic.Porta(ciphertext, 'KEY');
const decrypted = porta.decode();
console.log('Decrypted (first 100 chars):', decrypted.substring(0, 100));
console.log('');

console.log('Testing PolyalphabeticSolver...');
const solver = new PolyalphabeticSolver('english');
const result = solver.solvePorta(ciphertext, 3);
console.log('Found key:', result.key);
console.log('Score:', result.score);
console.log('Confidence:', result.confidence);
console.log('Decrypted (first 100 chars):', result.plaintext.substring(0, 100));
console.log('');

console.log('Testing KEY directly...');
const portaKey = new Polyalphabetic.Porta(ciphertext, 'KEY');
const decryptedKey = portaKey.decode();
const { Scorers } = nigma;
const keyScore = Scorers.scoreText(decryptedKey, 'english');
console.log('KEY score:', keyScore);
console.log('KEY decrypted (first 100 chars):', decryptedKey.substring(0, 100));

