import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import { FeedbackProvider } from './context/FeedbackContext';
import './styles/base.css';
import './styles/enhance.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AppProvider>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </AppProvider>
    </HashRouter>
  </React.StrictMode>,
);
