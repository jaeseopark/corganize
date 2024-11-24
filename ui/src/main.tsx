import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import { render } from "preact";
import { StrictMode } from "preact/compat";

import App from "./app";

render(
  <StrictMode>
    <Provider>
      <App />
      <Toaster />
    </Provider>
  </StrictMode>,
  document.getElementById("app")!,
);
