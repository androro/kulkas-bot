const SHALAT_QUOTES = [
  {
    type: 'quran',
    text: 'Mohonlah pertolongan dengan sabar dan salat.',
    source: 'QS. Al-Baqarah: 153',
  },
  {
    type: 'quran',
    text: 'Laksanakanlah salat untuk mengingat-Ku.',
    source: 'QS. Taha: 14',
  },
  {
    type: 'quran',
    text: 'Sesungguhnya salat itu mencegah dari perbuatan keji dan mungkar.',
    source: 'QS. Al-Ankabut: 45',
  },

  {
    type: 'advice',
    text: 'Jangan menganggap salat sebagai beban. Jadikanlah salat sebagai tempat untuk kembali dan memohon pertolongan kepada Allah.',
    source: null,
  },
  {
    type: 'advice',
    text: 'Jangan terburu-buru dalam mengerjakan salat demi urusan lain. Kamu sedang menghadap Allah yang berkuasa atas segala urusan.',
    source: null,
  },
  {
    type: 'advice',
    text: 'Salat bukan sekadar kewajiban, tetapi juga waktu untuk berhenti sejenak dari kesibukan dan kembali mengingat Allah.',
    source: null,
  },
  {
    type: 'advice',
    text: 'Jaga salatmu. Di tengah kesibukan dunia, selalu luangkan waktu untuk kembali kepada Allah.',
    source: null,
  },
  {
    type: 'advice',
    text: 'Semua orang ingin urusannya berjalan tepat waktu. Jangan sampai waktu salat justru menjadi hal yang terlupakan.',
    source: null,
  },
  {
    type: 'advice',
    text: 'Apa pun yang sedang kamu kerjakan, jangan lupa bahwa waktu salat tetap akan tiba.',
    source: null,
  },
];

let lastQuoteIndex = -1;

function getRandomQuote() {
  if (SHALAT_QUOTES.length === 1) {
    return SHALAT_QUOTES[0];
  }

  let index;

  do {
    index = Math.floor(Math.random() * SHALAT_QUOTES.length);
  } while (index === lastQuoteIndex);

  lastQuoteIndex = index;

  return SHALAT_QUOTES[index];
}

module.exports = {
  SHALAT_QUOTES,
  getRandomQuote,
};
