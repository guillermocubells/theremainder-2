import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { armarVigilante } from './lib/swWatchdog'
import './index.css'
import './i18n'

// Si el catalogo no carga en 20 s con un service worker instalado, se purga y
// se recarga una vez. Ver src/lib/swWatchdog.ts.
armarVigilante();

createRoot(document.getElementById("root")!).render(<App />);
