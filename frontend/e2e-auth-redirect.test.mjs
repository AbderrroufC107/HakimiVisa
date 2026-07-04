import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 5199;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOT_DIR = join(__dirname, 'e2e-screenshots');
const LOG_FILE = join(__dirname, 'e2e-results.json');

if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const PROTECTED_ROUTES = [
  '/dashboard',
  '/clients',
  '/kanban',
  '/visa-cases',
  '/appointments',
  '/notifications',
  '/audit-logs',
  '/pdf',
  '/backups',
  '/system-health',
  '/system-logs',
  '/settings',
];

const PUBLIC_ROUTES = [
  { path: '/login', label: 'Login page' },
  { path: '/tracking', label: 'Tracking page' },
];

const API_PATTERNS = ['/api/', 'auth/profile'];

function isApiRequest(url) {
  const u = url.toLowerCase();
  return API_PATTERNS.some(p => u.includes(p.toLowerCase()));
}

async function main() {
  // ====== START VITE SERVER ======
  console.log('Starting Vite dev server...');
  const server = await createServer({
    root: __dirname,
    server: { port: PORT, host: '127.0.0.1', strictPort: true },
    logLevel: 'silent',
  });
  await server.listen();
  console.log(`Vite server running at ${BASE_URL}`);

  // ====== LAUNCH PUPPETEER ======
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--incognito'],
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  // Collect errors
  const jsErrors = [];
  const consoleErrors = [];
  const networkLog = [];

  page.on('pageerror', err => {
    jsErrors.push({ message: err.message, stack: err.stack });
  });

  page.on('console', msg => {
    if (msg.type() === 'error') { consoleErrors.push(msg.text()); }
  });

  page.on('request', req => {
    const url = req.url();
    if (isApiRequest(url)) {
      networkLog.push({ url: url.replace(BASE_URL, ''), method: req.method(), type: req.resourceType() });
    }
  });

  const results = { protected: [], public: [], networkLog, jsErrors, consoleErrors, summary: {} };

  // ====== HELPER: clear storage ======
  async function clearStorage() {
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    const cookies = await context.cookies();
    for (const c of cookies) await context.deleteCookie(c);
  }

  async function verifyNoToken() {
    return await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return !keys.some(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('access'));
    });
  }

  // ====== STEP 1: Clear storage ======
  console.log('\n=== STEP 1: Clear storage & verify no token ===');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
  await clearStorage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });

  const noToken = await verifyNoToken();
  if (!noToken) {
    console.error('✗ Token STILL present after clearing!');
  } else {
    console.log('✓ Storage clean, no token present');
  }

  // ====== STEP 2: Test protected routes ======
  console.log('\n=== STEP 2: Test ALL protected routes ===\n');

  for (const route of PROTECTED_ROUTES) {
    // Clear storage before EACH route to ensure clean state
    await clearStorage();
    const apiBefore = networkLog.length;
    const errorsBefore = jsErrors.length;
    const consoleErrorsBefore = consoleErrors.length;

    try {
      await page.goto(BASE_URL + route, { waitUntil: 'networkidle0', timeout: 15000 });
      // Extra settle time
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      // Navigation might timeout if redirect is instant, that's OK
    }

    const finalUrl = page.url().replace(BASE_URL, '');
    const newApiCalls = networkLog.slice(apiBefore).filter(r => isApiRequest(r.url));
    const newJsErrors = jsErrors.slice(errorsBefore);
    const newConsoleErrors = consoleErrors.slice(consoleErrorsBefore);

    // Check if login page loaded
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 300) || '');

    const redirectedToLogin = finalUrl === '/login' || finalUrl.startsWith('/login');
    const noApiCalls = newApiCalls.length === 0;
    const noJsErrors = newJsErrors.length === 0;
    const noConsoleErrors = newConsoleErrors.length === 0;
    const pass = redirectedToLogin && noApiCalls && noJsErrors && noConsoleErrors;

    // Screenshot
    const safe = route.replace(/\//g, '_') || 'root';
    await page.screenshot({ path: join(SCREENSHOT_DIR, `protect_${safe}.png`), fullPage: true });

    results.protected.push({
      route, pass, finalUrl, apiCalls: newApiCalls.length, jsErrors: newJsErrors.length,
      consoleErrors: newConsoleErrors.length,
    });

    const icon = pass ? '✓' : '✗';
    const apiStr = `api:${newApiCalls.length}`;
    const errStr = `js:${newJsErrors.length}`;
    const consStr = `console:${newConsoleErrors.length}`;
    console.log(`  ${icon} ${route.padEnd(20)} -> ${finalUrl.padEnd(10)} (${apiStr}, ${errStr}, ${consStr})`);

    if (!pass) {
      if (!redirectedToLogin) console.log(`      Expected /login, got ${finalUrl}`);
      if (!noApiCalls) console.log(`      API calls: ${newApiCalls.map(r => r.url).join(', ')}`);
      if (!noJsErrors) console.log(`      JS errors: ${newJsErrors.map(e => e.message).join('; ')}`);
      if (!noConsoleErrors) console.log(`      Console errors: ${newConsoleErrors.join('; ')}`);
    }
  }

  // ====== STEP 3: Test public routes ======
  console.log('\n=== STEP 3: Test PUBLIC routes ===\n');

  for (const { path, label } of PUBLIC_ROUTES) {
    await clearStorage();
    try {
      await page.goto(BASE_URL + path, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {}

    const finalUrl = page.url().replace(BASE_URL, '');
    const stays = finalUrl === path;
    await page.screenshot({ path: join(SCREENSHOT_DIR, `public_${path.replace(/\//g, '_')}.png`), fullPage: true });

    results.public.push({ route: path, pass: stays, finalUrl });
    console.log(`  ${stays ? '✓' : '✗'} ${path.padEnd(20)} -> ${finalUrl} ${stays ? '(stays on page)' : '(redirected)'}`);
  }

  // ====== SUMMARY ======
  console.log('\n' + '='.repeat(55));
  console.log('  AUTH ROUTING VERIFICATION RESULTS');
  console.log('='.repeat(55) + '\n');

  const allProtectedPass = results.protected.every(r => r.pass);
  const allPublicPass = results.public.every(r => r.pass);

  for (const r of results.protected) {
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.route.padEnd(20)} ${r.finalUrl}`);
  }
  console.log('');
  for (const r of results.public) {
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.route.padEnd(20)} ${r.finalUrl}`);
  }
  console.log('');

  if (allProtectedPass && allPublicPass) {
    console.log('  ✓ ALL 14 TESTS PASSED');
    console.log('  ✓ Every protected route redirected to /login');
    console.log('  ✓ Zero API requests to protected endpoints');
    console.log('  ✓ Zero JavaScript errors');
    console.log('  ✓ Public routes /login and /tracking remain accessible');
  } else {
    console.log('  ✗ SOME TESTS FAILED');
  }

  console.log(`\n  Network log (API requests): ${results.networkLog.length}`);
  for (const r of results.networkLog) {
    console.log(`    ${r.method} ${r.url}`);
  }

  console.log(`\n  JS errors captured: ${results.jsErrors.length}`);
  for (const e of results.jsErrors) {
    console.log(`    ${e.message}`);
  }

  results.summary = {
    allProtectedPass,
    allPublicPass,
    totalPassed: results.protected.filter(r => r.pass).length + results.public.filter(r => r.pass).length,
    totalFailed: results.protected.filter(r => !r.pass).length + results.public.filter(r => !r.pass).length,
    apiRequestsBlocked: results.networkLog.length === 0,
  };

  writeFileSync(LOG_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n  Full JSON results: ${LOG_FILE}`);
  console.log(`  Screenshots: ${SCREENSHOT_DIR}`);

  // Cleanup
  await browser.close();
  await server.close();

  const exitCode = allProtectedPass && allPublicPass ? 0 : 1;
  console.log(`\n  Exit code: ${exitCode}`);
  process.exit(exitCode);
}

main().catch(async err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
