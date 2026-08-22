import { Component, type ErrorInfo, type ReactNode } from "react";
import "./ErrorBoundary.css";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort safety net. Nothing in this app should throw during render — the compiler and
 * type-checker are both defensive about malformed input — but with many independent users typing
 * arbitrary source, "should" isn't "can't": this turns an uncaught render error into a recoverable
 * screen instead of a blank white page with no way back in but a hard reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in State Machine Visualizer:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>The visualizer hit an unexpected error and can't continue safely. Your saved tabs are unaffected.</p>
          <pre className="error-boundary__message">{this.state.error.message}</pre>
          <button type="button" className="primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
