
require('dotenv').config();

async function main() {
  const baseUrl = process.env.DASHSCOPE_BASE_URL;
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const model = process.env.DASHSCOPE_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error('Konfigurasi API belum lengkap. Periksa .env');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: 'Balas singkat dalam bahasa Indonesia: Halo, Kulkas!',
        },
      ],
      max_tokens: 100,
    }),
    signal: AbortSignal.timeout(30000),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('API gagal:', response.status, data);
    process.exitCode = 1;
    return;
  }

  console.log('Qwen menjawab:', data.choices?.[0]?.message?.content);
}

main().catch((error) => {
  console.error('Tes gagal:', error.message);
  process.exitCode = 1;
});
