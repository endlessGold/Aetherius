import puppeteer from 'puppeteer';

// CLI Arguments Parser
const args = process.argv.slice(2);
let params = {
  duration: 240, // minutes
  cycle: 200,    // steps per cycle
  maxrows: 50000,
  backup: 60,    // minutes
  epochs: 3,
  batch: 128,
  lr: 0.01
};

// Simple arg parsing
args.forEach(arg => {
  const parts = arg.split('=');
  const key = parts[0];
  const val = parts[1];
  
  if (key && val && params.hasOwnProperty(key)) {
    params[key] = Number(val);
  }
});

const TARGET_URL = `http://localhost:3000/tools/dataset.html?autorun=true&duration=${params.duration}&cycle=${params.cycle}&maxrows=${params.maxrows}&backup=${params.backup}&epochs=${params.epochs}&batch=${params.batch}&lr=${params.lr}`;

(async () => {
  console.log('🚀 Launching Headless Browser for WebGPU Training...');
  console.log(`   URL: ${TARGET_URL}`);
  console.log('   (Press Ctrl+C to stop)');

  const browser = await puppeteer.launch({
    headless: "new", // Use new headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-unsafe-webgpu', // Enable WebGPU
      '--use-gl=angle',         // Required for WebGPU on some systems
      '--enable-features=Vulkan'
    ]
  });

  browser.on('disconnected', () => {
    console.log('❌ Browser disconnected/crashed.');
    process.exit(1);
  });

  const page = await browser.newPage();

  // Redirect console logs to CLI
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    // Filter out some noise if needed
    if (text.includes('[HMR]')) return;

    if (type === 'error') {
      console.error(`[Browser Error] ${text}`);
    } else {
      console.log(`[Browser] ${text}`);
    }

    // Detect completion
    if (text.includes('auto done') || text.includes('중지됨')) {
      console.log('✅ Training session completed.');
      browser.close().then(() => process.exit(0));
    }
  });

  page.on('pageerror', err => {
    console.error(`[Page Crash] ${err.toString()}`);
  });

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });
    console.log('✅ Page loaded. Training should start automatically...');
  } catch (e) {
    console.error('❌ Failed to load page:', e);
    await browser.close();
    process.exit(1);
  }

  // Keep alive until done or interrupted
  await new Promise(() => {}); 
})();
