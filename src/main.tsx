
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  // @ts-ignore: CSS side-effect import declarations are handled by the bundler
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  