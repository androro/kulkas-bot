const { createCanvas, loadImage } = require('@napi-rs/canvas');

/**
 * Generate avatar berbentuk lingkaran dengan border warna custom
 * @param {string} avatarUrl - URL avatar member
 * @param {string} borderColor - warna border, contoh: '#fda4af'
 * @returns {Promise<Buffer>} - buffer gambar PNG hasil generate
 */
async function generateCircleAvatar(avatarUrl, borderColor = '#fda4af') {
  const size = 350; // ukuran canvas/background (px)
  const avatarSize = 325; // ukuran gambar avatar (px)
  const borderWidth = (size - avatarSize) / 2; // otomatis kehitung = 12.5px

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Load gambar avatar dari URL
  const avatarImage = await loadImage(avatarUrl);

  // 1. Gambar lingkaran border (background)
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = borderColor;
  ctx.fill();

  // 2. Clip area lingkaran untuk avatar (di dalam border)
  const avatarRadius = avatarSize / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, avatarRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // 3. Gambar avatar di dalam area yang sudah di-clip
  ctx.drawImage(
    avatarImage,
    borderWidth,
    borderWidth,
    avatarSize,
    avatarSize
  );
  ctx.restore();

  // Return sebagai buffer PNG
  return canvas.encode('png');
}

module.exports = { generateCircleAvatar };