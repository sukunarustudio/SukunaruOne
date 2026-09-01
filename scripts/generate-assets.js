import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ICON_SOURCE = 'C:/Users/SUKUNARU/.gemini/antigravity/brain/bc09d025-1fc5-4747-b040-c554ba5a141e/.user_uploaded/media_1788158520732.png';
const SPLASH_SOURCE = 'C:/Users/SUKUNARU/.gemini/antigravity/brain/bc09d025-1fc5-4747-b040-c554ba5a141e/.user_uploaded/media_1788158524306.png';

const RES_DIR = path.resolve('android/app/src/main/res');

// Density mappings for App Icons
const ICON_CONFIGS = [
  { density: 'mipmap-mdpi', iconSize: 48, fgSize: 108, logoSize: 66 },
  { density: 'mipmap-hdpi', iconSize: 72, fgSize: 162, logoSize: 98 },
  { density: 'mipmap-xhdpi', iconSize: 96, fgSize: 216, logoSize: 132 },
  { density: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324, logoSize: 198 },
  { density: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432, logoSize: 264 },
];

// Splash screen dimensions
const SPLASH_CONFIGS = [
  { folder: 'drawable', width: 1280, height: 1920 },
  { folder: 'drawable-port-mdpi', width: 320, height: 480 },
  { folder: 'drawable-port-hdpi', width: 480, height: 800 },
  { folder: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { folder: 'drawable-port-xxhdpi', width: 960, height: 1600 },
  { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
  { folder: 'drawable-land-mdpi', width: 480, height: 320 },
  { folder: 'drawable-land-hdpi', width: 800, height: 480 },
  { folder: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { folder: 'drawable-land-xxhdpi', width: 1600, height: 960 },
  { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
];

async function generateAssets() {
  console.log('--- Generating Android App Icons ---');

  for (const cfg of ICON_CONFIGS) {
    const targetDir = path.join(RES_DIR, cfg.density);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Adaptive Icon Foreground (108dp canvas, ~60% logo in center with transparent background)
    const logoResized = await sharp(ICON_SOURCE)
      .resize(cfg.logoSize, cfg.logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: cfg.fgSize,
        height: cfg.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: logoResized, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    // 2. Legacy Square Icon (white background with logo centered)
    const squareLogo = await sharp(ICON_SOURCE)
      .resize(Math.round(cfg.iconSize * 0.82), Math.round(cfg.iconSize * 0.82), {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toBuffer();

    await sharp({
      create: {
        width: cfg.iconSize,
        height: cfg.iconSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: squareLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 3. Legacy Round Icon (circular mask with white background)
    const circleRadius = cfg.iconSize / 2;
    const circleSvg = Buffer.from(
      `<svg width="${cfg.iconSize}" height="${cfg.iconSize}"><circle cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius}" fill="white"/></svg>`
    );

    const baseRound = await sharp({
      create: {
        width: cfg.iconSize,
        height: cfg.iconSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: squareLogo, gravity: 'center' },
        { input: circleSvg, blend: 'dest-in' },
      ])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    console.log(`Generated icons for ${cfg.density}`);
  }

  console.log('\n--- Generating Android Splash Screens ---');

  for (const cfg of SPLASH_CONFIGS) {
    const targetDir = path.join(RES_DIR, cfg.folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Determine scale for logo inside splash screen
    const maxLogoWidth = Math.round(Math.min(cfg.width * 0.7, 600));
    const maxLogoHeight = Math.round(Math.min(cfg.height * 0.5, 600));

    const resizedSplashContent = await sharp(SPLASH_SOURCE)
      .resize(maxLogoWidth, maxLogoHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();

    await sharp({
      create: {
        width: cfg.width,
        height: cfg.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: resizedSplashContent, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`Generated splash for ${cfg.folder} (${cfg.width}x${cfg.height})`);
  }

  // Also generate web favicon / app icons
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  await sharp(ICON_SOURCE).resize(192, 192).png().toFile(path.join(publicDir, 'icon.png'));
  await sharp(ICON_SOURCE).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(ICON_SOURCE).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));

  console.log('\n=== All App Icons & Splash Screens generated successfully! ===');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
