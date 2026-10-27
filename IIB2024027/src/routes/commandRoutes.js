const express = require('express');
const path = require('node:path');
const { exec, execFile } = require('node:child_process');

const router = express.Router();
const NORMAL_INPUT = 'hello';
const MARKER = 'INJECTION_SUCCESS';
// Windows cmd uses &, while POSIX shells use ; as a command separator.
const SEPARATOR = process.platform === 'win32' ? '&' : ';';
const DEMO_PAYLOAD = `hello ${SEPARATOR} echo ${MARKER}`;
const ALLOWED_DEMO_INPUTS = new Set([NORMAL_INPUT, DEMO_PAYLOAD]);
const COMMAND_TIMEOUT_MS = 2000;
const MAX_OUTPUT_BYTES = 8 * 1024;
const PRINT_HELPER = path.join(__dirname, '..', 'printArgument.js');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', application: 'Command Injection Security Lab' });
});

router.get('/config', (req, res) => {
  res.json({
    normalInput: NORMAL_INPUT,
    demoPayload: DEMO_PAYLOAD,
    platform: process.platform,
    storage: 'browser localStorage; no database'
  });
});

function readDemoInput(req, res) {
  const input = req.body && req.body.input;
  if (typeof input !== 'string' || !ALLOWED_DEMO_INPUTS.has(input)) {
    res.status(400).json({
      error: 'For this local demonstration, input must be "hello" or the predefined harmless payload shown by the website.',
      allowedInputs: [NORMAL_INPUT, DEMO_PAYLOAD]
    });
    return null;
  }
  return input;
}

function markerIsIndependentOutputLine(stdout) {
  return String(stdout || '').split(/\r?\n/).some((line) => line.trim() === MARKER);
}

function makeResponse({ input, mode, error, stdout, stderr }) {
  const safeStdout = String(stdout || '').slice(0, MAX_OUTPUT_BYTES);
  const safeStderr = String(stderr || '').slice(0, MAX_OUTPUT_BYTES);
  const markerExecuted = markerIsIndependentOutputLine(safeStdout);

  return {
    input,
    executionMode: mode,
    stdout: safeStdout,
    stderr: safeStderr,
    exitCode: error ? (typeof error.code === 'number' ? error.code : null) : 0,
    timedOut: Boolean(error && error.killed),
    markerExecuted,
    success: !error,
    message: error
      ? (error.killed ? 'The command reached the time limit.' : 'The command returned an error; see the output panels.')
      : (markerExecuted
          ? 'The marker was produced as a separate command output line.'
          : 'The command completed without a separately executed marker command.')
  };
}

// INTENTIONALLY VULNERABLE FOR THIS LOCAL CLASS ASSIGNMENT ONLY.
// Input is restricted to two hard-coded harmless examples, but this command
// string deliberately demonstrates why concatenating input into exec() is unsafe.
router.post('/vulnerable', (req, res) => {
  const input = readDemoInput(req, res);
  if (input === null) return;

  exec(`echo ${input}`, {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
    encoding: 'utf8',
    windowsHide: true
  }, (error, stdout, stderr) => {
    res.json(makeResponse({ input, mode: 'exec() with shell interpretation (vulnerable demo)', error, stdout, stderr }));
  });
});

// PROTECTED VERSION: run Node.js with a helper script, passing input as one
// argument. execFile() does not launch a shell by default, so shell separators
// inside the input are treated as ordinary characters.
router.post('/protected', (req, res) => {
  const input = readDemoInput(req, res);
  if (input === null) return;

  execFile(process.execPath, [PRINT_HELPER, input], {
    shell: false,
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
    encoding: 'utf8',
    windowsHide: true
  }, (error, stdout, stderr) => {
    res.json(makeResponse({ input, mode: 'execFile() with argument vector (protected demo)', error, stdout, stderr }));
  });
});

module.exports = router;
