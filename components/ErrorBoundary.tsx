import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    // This is the key part. We clear the potentially corrupt state from localStorage.
    try {
      window.localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear localStorage", e);
      // Fallback if localStorage is unavailable
      this.setState({ hasError: false });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8 text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h1>
            <p className="text-lg text-gray-300 mb-6">The application has encountered a critical error. This can sometimes be caused by a temporary issue or corrupted saved data.</p>
            <p className="text-gray-400 mb-8">Resetting the application will clear your saved progress and restart the app. This usually fixes the problem.</p>
            
            <button
                onClick={this.handleReset}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
            >
                Reset Application
            </button>
            {this.state.error && (
                 <div className="mt-8 p-4 bg-gray-800 rounded-lg max-w-2xl text-left">
                    <h3 className="font-bold text-red-400 mb-2">Error Details:</h3>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all">
                        {this.state.error.toString()}
                    </pre>
                 </div>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
