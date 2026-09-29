import React from "react";

export default class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("[PreviewErrorBoundary] Product preview crashed:", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="sc-preview-error-fallback" role="alert">
          <div className="sc-preview-error-icon" aria-hidden="true">⚠</div>
          <p className="sc-preview-error-title">Preview unavailable</p>
          <p className="sc-preview-error-desc">
            This component couldn't load. Other products are unaffected.
          </p>
          <button
            type="button"
            className="sc-preview-error-retry"
            onClick={this.handleRetry}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
