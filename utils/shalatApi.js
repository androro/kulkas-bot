const https = require('node:https');

const CALCULATION_METHOD = 20;

function getPrayerTimes(location) {
  return new Promise((resolve, reject) => {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    const address = encodeURIComponent(location);

    const url =
      `https://api.aladhan.com/v1/timingsByAddress/` +
      `${day}-${month}-${year}` +
      `?address=${address}&method=${CALCULATION_METHOD}`;

    https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (result.code !== 200 || !result.data?.timings) {
            return reject(
              new Error('Jadwal shalat tidak ditemukan.')
            );
          }

          resolve(result.data);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

module.exports = {
  getPrayerTimes,
};
