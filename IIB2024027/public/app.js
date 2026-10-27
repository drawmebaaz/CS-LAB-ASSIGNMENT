const NORMAL_INPUT = 'hello';
const MARKER = 'INJECTION_SUCCESS';
const HISTORY_KEY = 'commandInjectionLab.history.v1';
const INPUT_KEY = 'commandInjectionLab.input.v1';
const MAX_HISTORY = 10;
let demoPayload = 'hello; echo INJECTION_SUCCESS';

const elements = {
  input: document.querySelector('#test-input'),
  normal: document.querySelector('#normal-button'),
  payload: document.querySelector('#payload-button'),
  reset: document.querySelector('#reset-button'),
  runVulnerable: document.querySelector('#run-vulnerable'),
  runProtected: document.querySelector('#run-protected'),
  compare: document.querySelector('#compare-button'),
  globalStatus: document.querySelector('#global-status'),
  comparisonNote: document.querySelector('#comparison-note'),
  storageStatus: document.querySelector('#storage-status'),
  historyList: document.querySelector('#history-list'),
  clearHistory: document.querySelector('#clear-history'),
  vulnerable: {
    status: document.querySelector('#vuln-status'),
    command: document.querySelector('#vuln-command'),
    output: document.querySelector('#vuln-output'),
    stderr: document.querySelector('#vuln-stderr'),
    marker: document.querySelector('#vuln-marker')
  },
  protected: {
    status: document.querySelector('#safe-status'),
    command: document.querySelector('#safe-command'),
    output: document.querySelector('#safe-output'),
    stderr: document.querySelector('#safe-stderr'),
    marker: document.querySelector('#safe-marker')
  }
};

function safeStorageGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeStorageRemove(key) {
  try { localStorage.removeItem(key); } catch { /* Storage can be disabled by browser settings. */ }
}

function getHistory() {
  try {
    const value = JSON.parse(safeStorageGet(HISTORY_KEY, '[]'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  const history = [entry, ...getHistory()].slice(0, MAX_HISTORY);
  const saved = safeStorageSet(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
  elements.storageStatus.textContent = saved
    ? 'Recent results are saved in this browser only (localStorage). No database is used.'
    : 'Browser storage is unavailable; results will not persist after refresh.';
}

function renderHistory() {
  const history = getHistory();
  elements.historyList.replaceChildren();
  if (history.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = 'No tests saved yet. Run a test to keep a local history.';
    elements.historyList.appendChild(empty);
    return;
  }

  for (const item of history) {
    const row = document.createElement('article');
    row.className = 'history-item';
    const heading = document.createElement('strong');
    heading.textContent = `${item.kind} · ${item.markerExecuted ? 'marker executed' : 'no separate marker'}`;
    const meta = document.createElement('span');
    meta.textContent = `${new Date(item.timestamp).toLocaleString()} · input: ${item.input}`;
    const output = document.createElement('pre');
    output.textContent = item.stdout || '(empty output)';
    row.append(heading, meta, output);
    elements.historyList.appendChild(row);
  }
}

function storeInput() {
  const saved = safeStorageSet(INPUT_KEY, elements.input.value);
  if (!saved) elements.storageStatus.textContent = 'Browser storage is unavailable; input will not persist after refresh.';
}

function setBusy(isBusy) {
  [elements.runVulnerable, elements.runProtected, elements.compare].forEach((button) => {
    button.disabled = isBusy;
  });
}

function getInput() { return elements.input.value; }

function clearPanel(panel, label) {
  panel.status.textContent = 'NOT RUN';
  panel.status.className = 'status-pill status-idle';
  panel.command.textContent = 'Waiting for a test…';
  panel.output.textContent = 'No output yet.';
  panel.stderr.textContent = 'No error output.';
  panel.marker.className = 'marker-result';
  panel.marker.querySelector('span:last-child').textContent = `${label} marker execution not checked yet.`;
}

function resetResults() {
  clearPanel(elements.vulnerable, 'Vulnerable');
  clearPanel(elements.protected, 'Protected');
  elements.globalStatus.textContent = 'Results reset. The saved browser history is unchanged.';
  elements.comparisonNote.querySelector('p').textContent = 'Tip: load the harmless payload and compare both implementations. The protected output should contain the payload literally, without executing a second command.';
}

function validateClientInput(input) {
  if (input !== NORMAL_INPUT && input !== demoPayload) {
    elements.globalStatus.textContent = 'Please use “hello” or click “Load harmless payload”. The server also validates this.';
    return false;
  }
  return true;
}

async function callEndpoint(kind, input) {
  const response = await fetch(`/api/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
}

function paintResult(panel, data, kind, input) {
  panel.status.textContent = data.success ? 'COMPLETED' : (data.timedOut ? 'TIMED OUT' : 'ERROR');
  panel.status.className = `status-pill ${data.success ? 'status-good' : 'status-bad'}`;
  panel.command.textContent = kind === 'vulnerable'
    ? `exec("echo ${input}")  // shell interprets command syntax`
    : `execFile(process.execPath, ["printArgument.js", ${JSON.stringify(input)}], { shell: false })`;
  panel.output.textContent = data.stdout || '(empty output)';
  panel.stderr.textContent = data.stderr || '(empty)';
  panel.marker.className = `marker-result ${data.markerExecuted ? 'is-bad' : 'is-good'}`;
  panel.marker.querySelector('span:last-child').textContent = data.markerExecuted
    ? `${MARKER} appeared as a separate output line: the extra command executed.`
    : `No separate marker output: the extra command did not execute.`;
}

function showComparison(vulnerable, protectedResult) {
  const p = elements.comparisonNote.querySelector('p');
  if (vulnerable.markerExecuted && !protectedResult.markerExecuted) {
    p.textContent = `Comparison confirmed: the vulnerable endpoint returned ${MARKER} as a separate output line. The protected endpoint printed the payload literally, without executing the second command.`;
  } else if (!vulnerable.markerExecuted && !protectedResult.markerExecuted) {
    p.textContent = 'Neither result contained the marker as a separate output line. Check stdout and stderr, then verify the platform-specific payload.';
  } else {
    p.textContent = 'The results differ from the expected behavior. Review stdout and stderr before drawing a conclusion.';
  }
}

function saveRun(kind, input, result) {
  saveHistory({
    timestamp: new Date().toISOString(),
    kind: kind === 'vulnerable' ? 'Vulnerable' : 'Protected',
    input,
    markerExecuted: Boolean(result.markerExecuted),
    stdout: String(result.stdout || '').slice(0, 500)
  });
}

async function runOne(kind) {
  const input = getInput();
  if (!validateClientInput(input)) return;
  storeInput();
  const panel = kind === 'vulnerable' ? elements.vulnerable : elements.protected;
  setBusy(true);
  elements.globalStatus.textContent = `Running ${kind} test…`;
  try {
    const result = await callEndpoint(kind, input);
    paintResult(panel, result, kind, input);
    saveRun(kind, input, result);
    elements.globalStatus.textContent = `${kind === 'vulnerable' ? 'Vulnerable' : 'Protected'} test completed.`;
  } catch (error) {
    panel.output.textContent = error.message;
    panel.status.textContent = 'ERROR';
    panel.status.className = 'status-pill status-bad';
    elements.globalStatus.textContent = `Test failed: ${error.message}`;
  } finally {
    setBusy(false);
  }
}

async function compareBoth() {
  const input = getInput();
  if (!validateClientInput(input)) return;
  storeInput();
  setBusy(true);
  elements.globalStatus.textContent = 'Running the same input against both endpoints…';
  try {
    const [vulnerable, protectedResult] = await Promise.all([
      callEndpoint('vulnerable', input),
      callEndpoint('protected', input)
    ]);
    paintResult(elements.vulnerable, vulnerable, 'vulnerable', input);
    paintResult(elements.protected, protectedResult, 'protected', input);
    showComparison(vulnerable, protectedResult);
    saveRun('vulnerable', input, vulnerable);
    saveRun('protected', input, protectedResult);
    elements.globalStatus.textContent = 'Comparison complete. Actual server results are shown above and saved in this browser.';
  } catch (error) {
    elements.globalStatus.textContent = `Comparison failed: ${error.message}`;
  } finally {
    setBusy(false);
  }
}

function initialize() {
  elements.input.value = NORMAL_INPUT;
  renderHistory();

  fetch('/api/config')
    .then((response) => {
      if (!response.ok) throw new Error('Could not load lab configuration.');
      return response.json();
    })
    .then((config) => {
      demoPayload = config.demoPayload;
      const remembered = safeStorageGet(INPUT_KEY, NORMAL_INPUT);
      elements.input.value = remembered === demoPayload ? demoPayload : NORMAL_INPUT;
      elements.globalStatus.textContent = `Connected to the local lab (${config.platform}). Choose a test to begin.`;
      elements.storageStatus.textContent = 'Browser localStorage is enabled for input and recent test history. No database is used.';
      setBusy(false);
    })
    .catch((error) => {
      elements.globalStatus.textContent = `Cannot reach the local API: ${error.message} Start it with npm start.`;
      elements.storageStatus.textContent = 'Local browser history is available, but tests require the Node.js server.';
      setBusy(true);
    });

  elements.input.addEventListener('input', storeInput);
  elements.normal.addEventListener('click', () => {
    elements.input.value = NORMAL_INPUT;
    storeInput();
    elements.globalStatus.textContent = 'Normal input loaded. Click a test button to run it.';
  });
  elements.payload.addEventListener('click', () => {
    elements.input.value = demoPayload;
    storeInput();
    elements.globalStatus.textContent = 'Harmless demonstration payload loaded. Click a test button to run it.';
  });
  elements.reset.addEventListener('click', resetResults);
  elements.runVulnerable.addEventListener('click', () => runOne('vulnerable'));
  elements.runProtected.addEventListener('click', () => runOne('protected'));
  elements.compare.addEventListener('click', compareBoth);
  elements.clearHistory.addEventListener('click', () => {
    safeStorageRemove(HISTORY_KEY);
    renderHistory();
    elements.storageStatus.textContent = 'Local test history cleared from this browser.';
  });
}

setBusy(true);
initialize();
