import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '../src/Pages/Home/LanguageContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <LanguageProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LanguageProvider>
  </HelmetProvider>
)
