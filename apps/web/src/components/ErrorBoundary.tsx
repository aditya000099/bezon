import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { Button } from '@bezon/ui';
import { WarningCircleIcon } from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our centralized system
    logger.error(error, errorInfo.componentStack || undefined);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-zinc-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 mb-6">
              <WarningCircleIcon className="h-8 w-8 text-rose-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-zinc-900">
              Something went wrong
            </h1>
            <p className="mb-8 text-sm text-zinc-500">
              We've been notified about this issue. Please try reloading the page.
            </p>
            <Button onClick={this.handleReload} className="w-full">
              Reload Page
            </Button>
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-6 rounded bg-zinc-100 p-4 text-left text-xs text-zinc-800 overflow-auto max-h-48">
                <strong>{this.state.error.message}</strong>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
