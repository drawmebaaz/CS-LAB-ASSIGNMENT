import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, UserRound, Trash2, ArrowUpRight, Fingerprint, HardDrive, Info } from 'lucide-react';

const ACCOUNT_KEY = 'csrf-browser-demo-account';
const CAT_SITE_ORIGIN = 'http://localhost:3001';

function readAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(() => readAccount());
  const [form, setForm] = useState({ username: '', email: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Browser-only teaching simulation: the cat site embeds this page with
    // ?csrf-demo=delete. This page's own code then changes its own localStorage.
    // There is no server endpoint, so this is NOT a classic server-side CSRF.
    const params = new URLSearchParams(window.location.search);
    if (params.get('csrf-demo') !== 'delete') return;

    const accountBeforeDelete = readAccount();
    localStorage.removeItem(ACCOUNT_KEY);
    setUser(null);
    setMessage(accountBeforeDelete
      ? 'Simulation complete: the cat-site iframe caused this page to remove the saved account.'
      : 'Simulation request processed, but there was no saved account to delete.');

    // Notify the cat page only. The parent checks the sender's origin.
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'CSRF_BROWSER_SIMULATION_RESULT',
        deleted: Boolean(accountBeforeDelete),
        username: accountBeforeDelete?.username || null
      }, CAT_SITE_ORIGIN);
    }
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  useEffect(() => {
    // Keep the visible account page in sync when the hidden iframe changes this
    // origin's localStorage from a different browsing context.
    const onStorage = (event) => {
      if (event.key === ACCOUNT_KEY || event.key === null) {
        const nextAccount = readAccount();
        setUser(nextAccount);
        if (!nextAccount) setMessage('The saved browser account was removed by another page.');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function submitAccount(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    if (username.length < 2 || !email.includes('@')) {
      setError('Enter a username (at least 2 characters) and a valid email.');
      return;
    }
    const account = {
      username,
      email,
      createdAt: new Date().toISOString(),
      id: `demo-${Math.random().toString(36).slice(2, 10)}`
    };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    setUser(account);
    setMessage('Demo account saved in this browser. No server or database is used.');
  }

  function deleteAccount() {
    const confirmed = window.confirm('Delete the demo account from this browser?');
    if (!confirmed) return;
    localStorage.removeItem(ACCOUNT_KEY);
    setUser(null);
    setMessage('Demo account removed from this browser.');
    setError('');
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="http://localhost:3000" aria-label="vulnerable.com home"><span className="brand-mark"><Fingerprint size={19} /></span><span>vulnerable<span className="brand-dot">.com</span></span></a>
      <div className="topbar-right"><span className="local-pill"><span className="pulse-dot"/> LOCAL LAB</span><span className="topbar-divider"/><span className="site-indicator">Browser-storage demo</span></div>
    </header>

    <main className="main-grid">
      <section className="intro-column">
        <div className="eyebrow"><span className="eyebrow-line"/> SECURITY TRAINING ENVIRONMENT</div>
        <h1>Your account.<br/><span>Not so protected.</span></h1>
        <p className="intro-copy">A browser-only teaching demo showing how a page can trigger an unwanted state change in a deliberately vulnerable client-side app.</p>
        <div className="flow-card">
          <div className="flow-card-heading"><span className="flow-icon"><ShieldAlert size={17}/></span><span>Demo flow</span><span className="flow-tag">SIMULATION</span></div>
          <div className="flow-step"><span className="step-number">01</span><div><strong>Create a demo account</strong><p>Your username and email are saved in this site's localStorage.</p></div></div>
          <div className="flow-connector"/>
          <div className="flow-step"><span className="step-number">02</span><div><strong>Visit the cat site</strong><p>A hidden iframe loads this site with a demo action parameter.</p></div></div>
          <div className="flow-connector"/>
          <div className="flow-step"><span className="step-number">03</span><div><strong>Check this page again</strong><p>This page's own JavaScript removes the saved account from localStorage.</p></div></div>
        </div>
        <div className="site-link-card"><div className="site-link-icon"><ArrowUpRight size={18}/></div><div><span className="site-link-kicker">SECOND SITE</span><strong>cat.com <span>· local demo</span></strong><p>Visiting starts the browser-storage simulation.</p></div><a href="http://localhost:3001" target="_blank" rel="noreferrer" className="site-link-action">Open site <ArrowUpRight size={14}/></a></div>
      </section>

      <section className="account-column">
        <div className="account-card">
          <div className="card-topline"><span className="card-icon"><UserRound size={20}/></span><span className={`status-pill ${user ? 'active' : 'inactive'}`}><span className="status-dot"/>{user ? 'ACCOUNT SAVED' : 'NO SAVED ACCOUNT'}</span></div>
          {user ? <>
            <p className="card-eyebrow">BROWSER-STORED ACCOUNT</p><h2>Welcome,<br/><span>{user.username}</span></h2>
            <div className="user-details"><div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div><div className="user-details-text"><strong>{user.username}</strong><span>{user.email}</span></div><span className="verified"><ShieldCheck size={16}/></span></div>
            <div className="session-note"><HardDrive size={15}/><span>Stored in localStorage for this origin only.</span></div>
            <button className="delete-button" onClick={deleteAccount}><Trash2 size={17}/>Delete demo account<span>LOCAL ONLY</span></button>
          </> : <>
            <p className="card-eyebrow">GET STARTED</p><h2>Create your<br/><span>demo account.</span></h2>
            <form onSubmit={submitAccount} className="auth-form">
              <label>Username<input name="username" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="e.g. demo-user" minLength="2" maxLength="32" autoComplete="off" required/></label>
              <label>Email address<input type="email" name="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" autoComplete="off" required/></label>
              <button className="primary-button" type="submit">Create demo account<ArrowUpRight size={17}/></button>
            </form>
            <div className="fine-print"><HardDrive size={14}/><span>No password is collected. This is a local UI simulation, not real authentication.</span></div>
          </>}
          {error && <div className="notice error-notice" role="alert">{error}</div>}
          {message && <div className="notice success-notice" role="status">{message}</div>}
        </div>
        <div className="vulnerability-note"><span className="warning-symbol">!</span><p><strong>Important limitation</strong><br/>There is no backend here. This simulates an unwanted browser-side state change; classic CSRF requires a server-side state-changing endpoint authenticated by ambient browser credentials.</p></div>
      </section>
    </main>
    <footer className="footer"><span>CSRF LAB <span className="footer-sep">/</span> REACT + LOCALSTORAGE</span><span>Loopback only · localhost</span></footer>
  </div>;
}
