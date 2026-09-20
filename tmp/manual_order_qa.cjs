require('../backend/node_modules/dotenv').config({ path: 'D:/K star light/backend/.env' });
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:4000/api';

(async () => {
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
  assert.equal(login.status, 200);
  const token = (await login.json()).token;
  const headers = { 'content-type': 'application/json', Authorization: `Bearer ${token}` };
  let id;
  try {
    const created = await fetch(`${base}/manual-orders`, { method: 'POST', headers, body: JSON.stringify({ customerName: 'Temporary QA Record', items: [{ description: 'Test lamp', quantity: 1 }], notes: 'Temporary admin test - delete after verification' }) });
    assert.equal(created.status, 201);
    id = (await created.json())._id;
    const updated = await fetch(`${base}/manual-orders/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ companyName: 'QA Company', status: 'confirmed' }) });
    assert.equal(updated.status, 200);
    const updateBody = await updated.json();
    assert.equal(updateBody.companyName, 'QA Company');
    assert.equal(updateBody.status, 'confirmed');
    const listed = await fetch(`${base}/manual-orders`, { headers });
    assert.equal(listed.status, 200);
    assert((await listed.json()).some((item) => item._id === id));
    console.log('manual order create, edit and list: passed');
  } finally {
    if (id) {
      const removed = await fetch(`${base}/manual-orders/${id}`, { method: 'DELETE', headers });
      assert.equal(removed.status, 200);
      const listed = await fetch(`${base}/manual-orders`, { headers });
      assert(!(await listed.json()).some((item) => item._id === id));
      console.log('temporary QA order deleted: passed');
    }
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1 });
