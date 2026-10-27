const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

const MARKER = 'INJECTION_SUCCESS';
let payload;

function hasMarkerAsOwnLine(stdout) {
  return String(stdout || '').split(/\r?\n/).some((line) => line.trim() === MARKER);
}

test('health endpoint responds successfully', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.status, 'ok');
});

test('config provides platform-specific harmless payload', async () => {
  const response = await request(app).get('/api/config').expect(200);
  payload = response.body.demoPayload;
  assert.equal(response.body.normalInput, 'hello');
  assert.match(payload, /INJECTION_SUCCESS/);
  assert.match(payload, process.platform === 'win32' ? /& echo/ : /; echo/);
  assert.match(response.body.storage, /localStorage/);
});

test('vulnerable endpoint prints normal input', async () => {
  const response = await request(app)
    .post('/api/vulnerable')
    .send({ input: 'hello' })
    .expect(200);
  assert.equal(response.body.success, true);
  assert.match(response.body.stdout, /^hello\r?\n?$/);
  assert.equal(response.body.markerExecuted, false);
});

test('vulnerable endpoint executes the harmless extra command', async () => {
  const config = await request(app).get('/api/config').expect(200);
  const response = await request(app)
    .post('/api/vulnerable')
    .send({ input: config.body.demoPayload })
    .expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.markerExecuted, true);
  assert.equal(hasMarkerAsOwnLine(response.body.stdout), true);
  assert.match(response.body.stdout, /hello/);
});

test('protected endpoint treats the same payload as literal text', async () => {
  const config = await request(app).get('/api/config').expect(200);
  const expectedPayload = config.body.demoPayload;
  const response = await request(app)
    .post('/api/protected')
    .send({ input: expectedPayload })
    .expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.markerExecuted, false);
  assert.equal(hasMarkerAsOwnLine(response.body.stdout), false);
  assert.equal(response.body.stdout, expectedPayload);
});

test('protected endpoint prints normal input', async () => {
  const response = await request(app)
    .post('/api/protected')
    .send({ input: 'hello' })
    .expect(200);
  assert.equal(response.body.stdout, 'hello');
  assert.equal(response.body.markerExecuted, false);
});

test('unknown input is rejected without command execution', async () => {
  const response = await request(app)
    .post('/api/vulnerable')
    .send({ input: 'not-an-approved-demo-input' })
    .expect(400);
  assert.match(response.body.error, /predefined harmless payload/);
});

test('missing input is rejected without starting a command', async () => {
  const response = await request(app)
    .post('/api/protected')
    .send({})
    .expect(400);
  assert.ok(response.body.error);
});
