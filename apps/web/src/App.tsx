import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppRouter } from './router/AppRouter';
import { ToastContainer } from './components/ToastContainer';
import { checkAuth } from './store/authSlice';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logger } from './utils/logger';

store.dispatch(checkAuth());

function App() {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      logger.error(`[Unhandled Error] ${event.message}`, event.error?.stack);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = typeof reason === 'string' ? reason : reason?.message || 'Unhandled Promise Rejection';
      const stack = reason?.stack || 'No stack trace available';
      logger.error(`[Unhandled Rejection] ${message}`, stack);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppRouter />
        <ToastContainer />
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
