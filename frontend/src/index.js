import React, { useEffect } from "react";
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/authentication/AuthProvider';
import { LoadingProvider, useLoading } from "./components/Loading/LoadingContext";
import { loadingController } from "./api/loadingController";
import LoadingOverlay from "./components/Loading/LoadingOverlay";

function LoaderConnector() {
  const { setLoading } = useLoading();
  useEffect(() => {
    loadingController.register(setLoading);
  }, [setLoading]);
  return <LoadingOverlay />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LoadingProvider>
    <LoaderConnector />
        <App />
  </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
