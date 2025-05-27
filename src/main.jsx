import { Auth0Provider } from "@auth0/auth0-react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./Context/DarkMode/ThemeProvider.jsx";
import { LogInContextProvider } from "./Context/LogInContext/Login.jsx";
import { RefProvider } from "./Context/RefContext/RefContext.jsx";
import { ErrorBoundary } from "./components/constants/Error.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Auth0Provider
        domain={import.meta.env.VITE_DOMAIN_NAME}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: "https://dev-w8utp8ajyc6prxcf.us.auth0.com/api/v2/"
        }}
      >
        <RefProvider>
          <LogInContextProvider>
            <ErrorBoundary>
              <Toaster />
              <App />
            </ErrorBoundary>
          </LogInContextProvider>
        </RefProvider>
      </Auth0Provider>
    </ThemeProvider>
  </BrowserRouter>
);
