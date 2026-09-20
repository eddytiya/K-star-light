require('../backend/node_modules/dotenv').config({ path: 'D:/K star light/backend/.env' });
const fs = require('node:fs');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const login = await fetch('http://127.0.0.1:4000/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
  const { token, admin } = await login.json();
  if (!token) throw new Error('Admin login failed');
  const targets = await (await fetch('http://127.0.0.1:9223/json')).json();
  const target = targets.find((item) => item.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 0;
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject });
  ws.onmessage = ({ data }) => { const message = JSON.parse(data); if (message.id && pending.has(message.id)) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result) } };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5174/' });
  await sleep(900);
  await send('Runtime.evaluate', { expression: `localStorage.setItem('adminToken', ${JSON.stringify(token)}); localStorage.setItem('adminProfile', ${JSON.stringify(JSON.stringify(admin))});` });
  const routes = ['/admin', '/admin/products', '/admin/categories', '/admin/enquiries', '/admin/orders', '/admin/manual-orders', '/admin/customers'];
  for (const route of routes) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://localhost:5174${route}` });
    await sleep(1050);
    const result = await send('Runtime.evaluate', { expression: `({title: document.querySelector('main h1')?.textContent, error: !!document.querySelector('.admin-error-state'), loading: !!document.querySelector('.admin-state[role="status"]'), cards: document.querySelectorAll('.customer-record-card,.enquiry-card,.category-card,.product-table tbody tr').length})`, returnByValue: true });
    console.log(route, JSON.stringify(result.result.value));
    if (route === '/admin') {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('D:/K star light/tmp/admin_dashboard_desktop.png', Buffer.from(shot.data, 'base64'));
    }
    if (route === '/admin/customers') {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('D:/K star light/tmp/admin_customers_desktop.png', Buffer.from(shot.data, 'base64'));
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await sleep(350);
      const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('D:/K star light/tmp/admin_customers_mobile.png', Buffer.from(mobileShot.data, 'base64'));
      await send('Runtime.evaluate', { expression: `document.querySelector('.admin-theme').click(); document.querySelector('.admin-menu-button').click()` });
      await sleep(250);
      const layout = await send('Runtime.evaluate', { expression: `({overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, menuOpen: !!document.querySelector('#admin-navigation.open'), theme: document.documentElement.dataset.theme})`, returnByValue: true });
      console.log('mobile layout', JSON.stringify(layout.result.value));
      const darkShot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('D:/K star light/tmp/admin_customers_mobile_dark.png', Buffer.from(darkShot.data, 'base64'));
    }
  }
  ws.close();
})().catch((error) => { console.error(error.message); process.exitCode = 1 });
