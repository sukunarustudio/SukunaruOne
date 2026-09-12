const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOGO_SRC = path.join(ROOT_DIR, 'logo app.png');
const SPLASH2_SRC = path.join(ROOT_DIR, 'splash2.png');

const DEBUG_RES_DIR = path.join(ROOT_DIR, 'android/app/src/debug/res');
const MAIN_RES_DIR = path.join(ROOT_DIR, 'android/app/src/main/res');

const BRAND_SPLASH_COLOR = '#FEAF46';

// Density configurations for Android launcher icons
const DENSITIES = [
  { name: 'mdpi', scale: 1, iconSize: 48, adaptiveSize: 108 },
  { name: 'hdpi', scale: 1.5, iconSize: 72, adaptiveSize: 162 },
  { name: 'xhdpi', scale: 2, iconSize: 96, adaptiveSize: 216 },
  { name: 'xxhdpi', scale: 3, iconSize: 144, adaptiveSize: 324 },
  { name: 'xxxhdpi', scale: 4, iconSize: 192, adaptiveSize: 432 },
];

const SPLASH_PORT_SIZES = [
  { folder: 'drawable-port-ldpi', w: 240, h: 320 },
  { folder: 'drawable-port-mdpi', w: 320, h: 480 },
  { folder: 'drawable-port-hdpi', w: 480, h: 800 },
  { folder: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { folder: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { folder: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
];

const SPLASH_LAND_SIZES = [
  { folder: 'drawable-land-ldpi', w: 320, h: 240 },
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
  console.log('--- Generating Android Assets (Debug & Main) from:', LOGO_SRC, 'and', SPLASH2_SRC, '---');

  if (!fs.existsSync(LOGO_SRC)) {
    throw new Error('File logo app.png not found at ' + LOGO_SRC);
  }
  if (!fs.existsSync(SPLASH2_SRC)) {
    throw new Error('File splash2.png not found at ' + SPLASH2_SRC);
  }

  // 1. Create Base Adaptive Background SVG Gradient matching brand colors
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

  // 2. Generate Mipmap Icons in both debug and main
  for (const targetResDir of [DEBUG_RES_DIR, MAIN_RES_DIR]) {
    for (const d of DENSITIES) {
      const mipmapDir = path.join(targetResDir, `mipmap-${d.name}`);
      ensureDir(mipmapDir);

      // A. ic_launcher_background.png
      const bgBuffer = Buffer.from(bgSvg(d.adaptiveSize, d.adaptiveSize));
      await sharp(bgBuffer)
        .resize(d.adaptiveSize, d.adaptiveSize)
        .png()
        .toFile(path.join(mipmapDir, 'ic_launcher_background.png'));

      // B. ic_launcher_foreground.png
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

      // C. ic_launcher.png
      await sharp(LOGO_SRC)
        .resize(d.iconSize, d.iconSize, { fit: 'contain' })
        .png()
        .toFile(path.join(mipmapDir, 'ic_launcher.png'));

      // D. ic_launcher_round.png
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
    }

    // 3. mipmap-anydpi-v26 XML configuration
    const anydpiDir = path.join(targetResDir, 'mipmap-anydpi-v26');
    ensureDir(anydpiDir);

    const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf-8');
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf-8');
  }
  console.log('Generated adaptive and mipmap launcher icons in debug and main.');

  // 4. Generate Android Splash Drawables (Full bleed cover from SPLASH2_SRC)
  for (const targetResDir of [DEBUG_RES_DIR, MAIN_RES_DIR]) {
    const drawableDir = path.join(targetResDir, 'drawable');
    ensureDir(drawableDir);

    // splash_icon_debug.png (288x288 crisp icon for Android 12+ SplashScreen API)
    await sharp(LOGO_SRC)
      .resize(288, 288, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(drawableDir, 'splash_icon_debug.png'));

    // Default drawable/splash.png
    await sharp(SPLASH2_SRC)
      .resize(1080, 2400, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(drawableDir, 'splash.png'));

    const drawableNightDir = path.join(targetResDir, 'drawable-night');
    ensureDir(drawableNightDir);
    await sharp(SPLASH2_SRC)
      .resize(1080, 2400, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(drawableNightDir, 'splash.png'));

    // Portrait drawables (normal & night)
    for (const s of SPLASH_PORT_SIZES) {
      const pDir = path.join(targetResDir, s.folder);
      ensureDir(pDir);
      await sharp(SPLASH2_SRC)
        .resize(s.w, s.h, { fit: 'cover', position: 'center' })
        .png()
        .toFile(path.join(pDir, 'splash.png'));

      const pNightDir = path.join(targetResDir, s.folder.replace('drawable-port-', 'drawable-port-night-'));
      ensureDir(pNightDir);
      await sharp(SPLASH2_SRC)
        .resize(s.w, s.h, { fit: 'cover', position: 'center' })
        .png()
        .toFile(path.join(pNightDir, 'splash.png'));
    }

    // Landscape drawables (normal & night)
    for (const s of SPLASH_LAND_SIZES) {
      const lDir = path.join(targetResDir, s.folder);
      ensureDir(lDir);
      await sharp(SPLASH2_SRC)
        .resize(s.w, s.h, { fit: 'cover', position: 'center' })
        .png()
        .toFile(path.join(lDir, 'splash.png'));

      const lNightDir = path.join(targetResDir, s.folder.replace('drawable-land-', 'drawable-land-night-'));
      ensureDir(lNightDir);
      await sharp(SPLASH2_SRC)
        .resize(s.w, s.h, { fit: 'cover', position: 'center' })
        .png()
        .toFile(path.join(lNightDir, 'splash.png'));
    }
  }
  console.log('Generated full-bleed Android splash drawables from splash2.png.');

  // 5. XML Values for DEBUG Theme and Splash Colors (#FEAF46)
  const debugValuesDir = path.join(DEBUG_RES_DIR, 'values');
  ensureDir(debugValuesDir);

  const debugColorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_bg_debug">${BRAND_SPLASH_COLOR}</color>
    <color name="splash_status_bar_debug">${BRAND_SPLASH_COLOR}</color>
    <color name="splash_nav_bar_debug">${BRAND_SPLASH_COLOR}</color>
</resources>
`;
  fs.writeFileSync(path.join(debugValuesDir, 'colors.xml'), debugColorsXml, 'utf-8');

  const debugStylesXml = `<?xml version="1.0" encoding="utf-8"?>
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
  fs.writeFileSync(path.join(debugValuesDir, 'styles.xml'), debugStylesXml, 'utf-8');

  // 6. Generate Web App Logo and Splash from LOGO_SRC and SPLASH2_SRC
  const webLogoBuf = await sharp(LOGO_SRC)
    .resize(512, 512, { fit: 'contain' })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(ROOT_DIR, 'public/app-logo.png'), webLogoBuf);
  fs.writeFileSync(path.join(ROOT_DIR, 'src/assets/app-logo.png'), webLogoBuf);
  console.log('Updated public/app-logo.png and src/assets/app-logo.png with Logo Mark Type B.');

  // Create Web/App Splash Screen from SPLASH2_SRC with cover fit (no bars)
  const splash2Buf = await sharp(SPLASH2_SRC)
    .resize(1080, 2400, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(ROOT_DIR, 'public/splash.png'), splash2Buf);
  fs.writeFileSync(path.join(ROOT_DIR, 'public/splash2.png'), splash2Buf);
  fs.writeFileSync(path.join(ROOT_DIR, 'src/assets/splash.png'), splash2Buf);
  console.log('Updated public/splash.png and public/splash2.png with full bleed cover from splash2.png.');
  console.log('--- ALL ANDROID & WEB ASSETS GENERATED SUCCESSFULLY ---');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
