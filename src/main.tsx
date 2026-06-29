import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
// Importamos el registro automático del Service Worker generado por vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

// @ts-ignore: CSS side-effect import declarations are handled by the bundler
import "./styles/index.css";

// Registra el service worker inmediatamente al cargar la página
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);
  