import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AdminProvider } from './context/AdminContext';
import { RBACProvider } from './context/RBACContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AdminProvider>
        <RBACProvider>
          <App />
        </RBACProvider>
      </AdminProvider>
    </ThemeProvider>
  </StrictMode>,
);
