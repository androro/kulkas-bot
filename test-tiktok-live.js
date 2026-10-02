const { TikTokLiveConnection } = require('tiktok-live-connector');

async function test() {
  const username = process.argv[2] || 'sebutazza';

  console.log(`Checking @${username}...`);

  try {
    const connection = new TikTokLiveConnection(username, {
      processInitialData: false,
    });

    console.log('✅ Constructor OK');

    const roomId = await connection.fetchRoomId();
    console.log('✅ ROOM ID:', roomId);

    console.log('\n🔍 Checking LIVE status...');

    const isLive = await connection.fetchIsLive();

    console.log('\n📺 LIVE STATUS:', isLive);
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error);
    console.error('\nSTACK:');
    console.error(error?.stack);
  }
}

test();
