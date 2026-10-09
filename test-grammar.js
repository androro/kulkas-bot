
const assert = require('node:assert/strict');
const { findGrammarReferences } = require('./utils/kulkasAI');

function patternsOf(query) {
  return findGrammarReferences(query).map((entry) => entry.pattern);
}

assert(patternsOf('Jelaskan pola 〜がてら').includes('〜がてら'));
assert(patternsOf('Jelaskan pola 〜かたわら').includes('〜かたわら'));

const comparison = patternsOf('Apa bedanya 〜がてら dan 〜かたわら?');
assert(comparison.includes('〜がてら'));
assert(comparison.includes('〜かたわら'));

console.log('✅ Semua tes pencarian grammar berhasil.');
