import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// StrictMode is intentionally omitted here so the one-shot query-string
// demonstration action is not replayed by React's development effect checks.
createRoot(document.getElementById('root')).render(<App />);
