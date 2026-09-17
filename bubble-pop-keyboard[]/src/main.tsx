import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';
import './index.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0a0a0f', paper: '#111118' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: '#0a0a0f' } },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
