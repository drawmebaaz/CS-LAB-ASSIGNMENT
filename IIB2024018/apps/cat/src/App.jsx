import { useEffect, useState } from 'react';
import { Cat, Heart, PawPrint, Sparkles, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';

const VULNERABLE_ORIGIN = 'http://localhost:3000';

export default function App() {
  const [triggered, setTriggered] = useState(false);
  const [state, setState] = useState('Preparing the browser-only demonstration…');

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== VULNERABLE_ORIGIN) return;
      if (event.data?.type !== 'CSRF_BROWSER_SIMULATION_RESULT') return;
      setState(event.data.deleted
        ? `Simulation complete: the account for ${event.data.username} was removed from vulnerable.com's localStorage.`
        : 'The page-load action ran, but no account was stored to delete. Create one on vulnerable.com and try again.');
    };
    window.addEventListener('message', onMessage);
    const timer = window.setTimeout(() => {
      setState('Loading the hidden demo frame…');
      setTriggered(true);
    }, 500);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };
  }, []);

  return <div className="cat-page">
    <header className="cat-nav"><a href="http://localhost:3001" className="cat-logo"><span className="cat-logo-icon"><Cat size={21}/></span><span>cat<span>.com</span></span></a><div className="cat-nav-right"><span className="tiny-heart"><Heart size={13} fill="currentColor"/></span><span>THE INTERNET'S COZIEST CORNER</span></div></header>
    <main className="cat-main">
      <div className="cat-copy">
        <div className="cat-eyebrow"><Sparkles size={14}/> YOUR DAILY DOSE OF CAT</div>
        <h1>Small paws.<br/><span>Big purr-sonality.</span></h1>
        <p className="cat-lede">A little corner of the internet for people who believe every problem is improved by a cat.</p>
        <div className="cat-photo-wrap"><img className="cat-photo" src="/cat.svg" alt="A cheerful orange cat sitting with its tail curled around its paws"/><span className="photo-sticker"><Heart size={12} fill="currentColor"/> certified cutie</span></div>
        <div className="cat-caption"><span className="caption-paw"><PawPrint size={17}/></span><div><strong>Meet Marmalade</strong><span>Professional napper. Part-time troublemaker.</span></div><span className="caption-sparkle"><Sparkles size={18}/></span></div>
      </div>
      <aside className="cat-side">
        <div className="welcome-card"><div className="welcome-icon"><Cat size={22}/></div><span className="welcome-kicker">WELCOME, CAT PERSON</span><h2>Glad you're<br/>here.</h2><p>Take a breath, admire the whiskers, and enjoy your very important cat break.</p><div className="cat-tags"><span>#catsofweb</span><span>#pawsitivevibes</span></div></div>
        <div className="request-card"><div className="request-header"><span className="request-indicator"><span/> BROWSER DEMO STATUS</span><ShieldAlert size={17}/></div><p>{state}</p><div className="request-progress"><span/></div><span className="request-footnote">This is a client-side simulation. No server or database is involved.</span></div>
        <a className="back-link" href="http://localhost:3000"><ArrowLeft size={16}/> Back to vulnerable.com <ExternalLink size={12}/></a>
      </aside>
    </main>
    <footer className="cat-footer"><span>made with an unreasonable amount of cat appreciation</span><span>CAT SITE <i>·</i> LOCAL DEMO</span></footer>
    {triggered && <iframe title="Browser-only CSRF-style simulation frame" src={`${VULNERABLE_ORIGIN}/?csrf-demo=delete`} className="hidden-frame" tabIndex="-1" aria-hidden="true" />}
  </div>;
}
