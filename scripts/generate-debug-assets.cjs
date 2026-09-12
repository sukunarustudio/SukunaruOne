const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOGO_SRC = path.join(ROOT_DIR, 'logo app.png');
const SPLASH1_SRC = path.join(ROOT_DIR, 'splash1.png');
const SPLASH2_SRC = path.join(ROOT_DIR, 'splash2.png');

const DEBUG_RES_DIR = path.join(ROOT_DIR, 'android/app/src/debug/res');

// Density configurations for Android launcher icons
// Android Adaptive icon specs:
// Total canvas: 108dp x 108dp
// Safe zone: inner 66dp-72dp (approx 66.7% of total width)
const DENSITIES = [
  { name: 'mdpi', scale: 1, iconSize: 48, adaptiveSize: 108 },
  { name: 'hdpi', scale: 1.5, iconSize: 72, adaptiveSize: 162 },
  { name: 'xhdpi', scale: 2, iconSize: 96, adaptiveSize: 216 },
  { name: 'xxhdpi', scale: 3, iconSize: 144, adaptiveSize: 324 },
  { name: 'xxxhdpi', scale: 4, iconSize: 192, adaptiveSize: 432 },
];

const SPLASH_PORT_SIZES = [
  { folder: 'drawable-port-mdpi', w: 320, h: 480 },
  { folder: 'drawable-port-hdpi', w: 480, h: 800 },
  { folder: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { folder: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { folder: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
];

const SPLASH_LAND_SIZES = [
  { folder: 'drawable-land-mdpi', w: 480, h: 320 },
  { folder: 'drawable-land-hdpi', w: 800, h: 480 },
  { folder: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { folder: 'drawable-land-xxhdpi', w: 1600, h: 960 },
  { folder: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateAssets() {
  console.log('--- Generating Android DEBUG assets from:', LOGO_SRC, '---');

  if (!fs.existsSync(LOGO_SRC)) {
    throw new Error('File logo app.png not found at ' + LOGO_SRC);
  }

  // 1. Create Base Adaptive Background SVG Gradient
  // Gradient matching logo app.png (#FFD254 to #FF872D)
  const bgSvg = (w, h = w) => `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFD254"/>
          <stop offset="50%" stop-color="#FFAF37"/>
          <stop offset="100%" stop-color="#FF872D"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#brandGrad)"/>
    </svg>
  `;

  // 2. Extract the letter "B" (Logo Mark) or create foreground layer
  // In logo app.png, the letter "B" is in the center with drop shadow.
  // Inside 108dp canvas, safe zone is 72dp (66.7%).
  // Let's create foreground by placing the logo mark centered at ~65% size of adaptive canvas.
  
  for (const d of DENSITIES) {
    const mipmapDir = path.join(DEBUG_RES_DIR, `mipmap-${d.name}`);
    ensureDir(mipmapDir);

    // A. ic_launcher_background.png (Full bleed gradient square)
    const bgBuffer = Buffer.from(bgSvg(d.adaptiveSize, d.adaptiveSize));
    await sharp(bgBuffer)
      .resize(d.adaptiveSize, d.adaptiveSize)
      .png()
      .toFile(path.join(mipmapDir, 'ic_launcher_background.png'));

    // B. ic_launcher_foreground.png
    // The logo mark placed inside the safe zone (62% of adaptive size for optimal padding and no clipping under circular masks)
    const safeLogoSize = Math.round(d.adaptiveSize * 0.62);
    const logoResized = await sharp(LOGO_SRC)
      .resize(safeLogoSize, safeLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: d.adaptiveSize,
        height: d.adaptiveSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: logoResized, gravity: 'center' }])
      .png()
      .toFile(path.join(mipmapDir, 'ic_launcher_foreground.png'));

    // C. ic_launcher.png (Legacy square/rounded-square icon)
    await sharp(LOGO_SRC)
      .resize(d.iconSize, d.iconSize, { fit: 'contain' })
      .png()
      .toFile(path.join(mipmapDir, 'ic_launcher.png'));

    // D. ic_launcher_round.png (Circular masked icon)
    const circleMaskSvg = `
      <svg width="${d.iconSize}" height="${d.iconSize}" viewBox="0 0 ${d.iconSize} ${d.iconSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${d.iconSize / 2}" cy="${d.iconSize / 2}" r="${d.iconSize / 2}" fill="#ffffff"/>
      </svg>
    `;
    const circleMask = Buffer.from(circleMaskSvg);
    const roundBase = await sharp(LOGO_SRC)
      .resize(d.iconSize, d.iconSize, { fit: 'cover' })
      .toBuffer();

    await sharp(roundBase)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(mipmapDir, 'ic_launcher_round.png'));

    console.log(`Generated mipmap-${d.name} (${d.iconSize}px / adaptive ${d.adaptiveSize}px)`);
  }

  // 3. mipmap-anydpi-v26 XML configuration
  const anydpiDir = path.join(DEBUG_RES_DIR, 'mipmap-anydpi-v26');
  ensureDir(anydpiDir);

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf-8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf-8');
  console.log('Generated mipmap-anydpi-v26 XML definitions.');

  // 4. Android System Splash Drawables (Minimal: Orange brand + Logo Mark Type B in center)
  const drawableDir = path.join(DEBUG_RES_DIR, 'drawable');
  ensureDir(drawableDir);

  // splash_icon_debug.png (for Android 12+ SplashScreen API: 288x288 crisp icon)
  await sharp(LOGO_SRC)
    .resize(288, 288, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(drawableDir, 'splash_icon_debug.png'));

  // Default drawable/splash.png
  const defLogo = await sharp(LOGO_SRC)
    .resize(280, 280, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const defBgBuf = Buffer.from(bgSvg(1280, 1920));
  await sharp(defBgBuf)
    .composite([{ input: defLogo, gravity: 'center' }])
    .png()
    .toFile(path.join(drawableDir, 'splash.png'));

  // Generate density-specific drawables for portrait & landscape
  for (const s of SPLASH_PORT_SIZES) {
    const dDir = path.join(DEBUG_RES_DIR, s.folder);
    ensureDir(dDir);

    const logoSize = Math.round(Math.min(s.w, s.h) * 0.28);
    const logoBuf = await sharp(LOGO_SRC)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const bgBuf = Buffer.from(bgSvg(s.w, s.h));
    await sharp(bgBuf)
      .composite([{ input: logoBuf, gravity: 'center' }])
      .png()
      .toFile(path.join(dDir, 'splash.png'));

    console.log(`Generated ${s.folder}/splash.png (${s.w}x${s.h})`);
  }

  for (const s of SPLASH_LAND_SIZES) {
    const dDir = path.join(DEBUG_RES_DIR, s.folder);
    ensureDir(dDir);

    const logoSize = Math.round(Math.min(s.w, s.h) * 0.35);
    const logoBuf = await sharp(LOGO_SRC)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const bgBuf = Buffer.from(bgSvg(s.w, s.h));
    await sharp(bgBuf)
      .composite([{ input: logoBuf, gravity: 'center' }])
      .png()
      .toFile(path.join(dDir, 'splash.png'));

    console.log(`Generated ${s.folder}/splash.png (${s.w}x${s.h})`);
  }

  // 5. XML Values for DEBUG Theme and Splash Colors
  const valuesDir = path.join(DEBUG_RES_DIR, 'values');
  ensureDir(valuesDir);

  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_bg_debug">#FF9B51</color>
    <color name="splash_status_bar_debug">#FFD254</color>
    <color name="splash_nav_bar_debug">#FF872D</color>
</resources>
`;
  fs.writeFileSync(path.join(valuesDir, 'colors.xml'), colorsXml, 'utf-8');

  const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- DEBUG-Specific Splash & App Theme -->
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <item name="android:windowBackground">@color/splash_bg_debug</item>
        <item name="android:statusBarColor">#EAEFEF</item>
        <item name="android:navigationBarColor">#FFFFFF</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@color/splash_bg_debug</item>
        <item name="windowSplashScreenBackground">@color/splash_bg_debug</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_icon_debug</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>
`;
  fs.writeFileSync(path.join(valuesDir, 'styles.xml'), stylesXml, 'utf-8');

  // 6. Generate Web App Logo and Splash (public/app-logo.png, src/assets/app-logo.png, public/splash.png)
  const webLogoBuf = await sharp(LOGO_SRC)
    .resize(512, 512, { fit: 'contain' })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(ROOT_DIR, 'public/app-logo.png'), webLogoBuf);
  fs.writeFileSync(path.join(ROOT_DIR, 'src/assets/app-logo.png'), webLogoBuf);
  console.log('Updated public/app-logo.png and src/assets/app-logo.png with Logo Mark Type B.');

  // Create Web Splash Screen (1080x2400) with warm orange gradient, Logo Mark Type B, typography, tagline & version
  const webLogoLarge = await sharp(LOGO_SRC)
    .resize(280, 280, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const webSplashSvg = `
    <svg width="1080" height="2400" viewBox="0 0 1080 2400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="webGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFD254"/>
          <stop offset="45%" stop-color="#FFAF37"/>
          <stop offset="100%" stop-color="#FF872D"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="2400" fill="url(#webGrad)"/>
      <g transform="translate(540, 1340)" text-anchor="middle">
        <text font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" font-style="italic" fill="#25343F" letter-spacing="-1.5">Bisnis<tspan fill="#ffffff">Urang</tspan></text>
        <text y="70" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="30" font-weight="700" fill="#25343F" opacity="0.85" letter-spacing="-0.5">Usaha tercatat, Kelola jadi mudah.</text>
      </g>
      <g transform="translate(540, 2260)" text-anchor="middle">
        <line x1="-50" y1="-20" x2="50" y2="-20" stroke="#25343F" stroke-width="3" stroke-linecap="round" opacity="0.2"/>
        <text y="14" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#25343F" opacity="0.65">Version 2.0</text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(webSplashSvg))
    .composite([
      { input: webLogoLarge, top: 920, left: Math.round((1080 - 280) / 2) }
    ])
    .png()
    .toFile(path.join(ROOT_DIR, 'public/splash.png'));

  console.log('Updated public/splash.png with new branding.');
  console.log('--- ALL ANDROID DEBUG ASSETS & WEB BRANDING GENERATED SUCCESSFULLY ---');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
