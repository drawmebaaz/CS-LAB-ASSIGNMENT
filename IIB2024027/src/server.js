const app = require('./app');

// Do not allow the deliberately vulnerable demo to bind to a LAN/public interface.
// It must only be reachable from this computer via localhost.
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('PORT must be a valid TCP port between 1 and 65535.');
  process.exit(1);
}

app.listen(PORT, HOST, () => {
  console.log(`Command Injection Security Lab listening at http://${HOST}:${PORT}`);
  console.log('Local-only educational demo. Do not expose this server to a network.');
  console.log('No database is used; test history is stored in browser localStorage.');
});
