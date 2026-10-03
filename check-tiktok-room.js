const { TikTokLiveConnection } = require('tiktok-live-connector');

async function main() {
  const username = 'sebutazza';

  console.log(`🔍 Mengecek data LIVE @${username}...\n`);

  try {
    const connection = new TikTokLiveConnection(username, {
      processInitialData: false,
    });

    const result = await connection.fetchIsLive();

    console.log('========== FETCH IS LIVE ==========\n');
    console.dir(result, {
      depth: null,
      colors: true,
    });

    console.log('\n========== SELESAI ==========\n');
  } catch (error) {
    console.error('❌ Gagal:', error);
  }
}

main();
