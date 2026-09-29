import React, { Component } from 'react';

const isDevelopment = import.meta.env.DEV;

export function getSafeErrorType(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";

  if (
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("access denied") ||
    message.includes("missing or insufficient permissions") ||
    code.includes("permission-denied") ||
    code.includes("unauthenticated") ||
    code.includes("unauthorized")
  ) {
    return "permission";
  }

  if (
    message.includes("network") ||
    message.includes("offline") ||
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("connection") ||
    code.includes("unavailable")
  ) {
    return "offline";
  }

  return "general";
}

function getSafeErrorCopy(type, isClassroom) {
  if (type === "offline") {
    return {
      title: "You're offline",
      description: "Check your internet connection. STEA Classroom will reconnect when you're back online.",
      buttons: ["tryAgain", "goBack"],
    };
  }

  if (type === "permission") {
    return {
      title: "We couldn't access this classroom",
      description: "Your account may not have access, or your session may need refreshing.",
      buttons: ["refreshSession", "myClasses", "goBack"],
    };
  }

  return {
    title: "Something went wrong",
    description: isClassroom
      ? "STEA Classroom couldn't load this page. Please try again."
      : "STEA couldn't load this page. Please try again.",
    buttons: isClassroom ? ["tryAgain", "goBack", "myClasses"] : ["tryAgain", "goBack"],
  };
}

function isClassroomLocation() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.startsWith("classroom.") || window.location.pathname.startsWith("/classroom");
}

const buttonStyles = {
  primary: {
    background: 'linear-gradient(135deg, #F5A623, #FFD17C)',
    color: '#0c0800',
    border: 'none',
    boxShadow: '0 4px 16px rgba(245,166,35,0.25)',
  },
  secondary: {
    background: '#F9FAFB',
    color: '#374151',
    border: '1px solid #E5E7EB',
  },
};

export function SafeErrorScreen({ error, errorInfo, onRetry, isClassroom = isClassroomLocation() }) {
  const type = getSafeErrorType(error);
  const copy = getSafeErrorCopy(type, isClassroom);
  const technicalDetails = `${error?.message || String(error || "")}\n\n${error?.stack || ""}\n\n${errorInfo?.componentStack || ""}`.trim();

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign(isClassroom ? "/classroom" : "/");
  };

  const tryAgain = () => {
    const handled = onRetry?.();
    if (handled === false) window.location.reload();
  };

  const refreshSession = () => {
    window.location.reload();
  };

  const myClasses = () => {
    window.location.assign("/classroom");
  };

  const renderButton = (button) => {
    const config = {
      tryAgain: { label: "Try Again", onClick: tryAgain, style: buttonStyles.primary },
      goBack: { label: "Go Back", onClick: goBack, style: buttonStyles.secondary },
      myClasses: { label: "My Classes", onClick: myClasses, style: buttonStyles.secondary },
      refreshSession: { label: "Refresh Session", onClick: refreshSession, style: buttonStyles.primary },
    }[button];

    return (
      <button
        key={button}
        onClick={config.onClick}
        style={{
          borderRadius: 12,
          padding: '12px 22px',
          fontWeight: 800,
          fontSize: 14,
          cursor: 'pointer',
          ...config.style,
        }}
      >
        {config.label}
      </button>
    );
  };

  return (
    <div style={{
      background: '#FFFFFF',
      color: '#111827',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: 24,
      textAlign: 'center'
    }}>
      <div style={{
        width: 88,
        height: 88,
        borderRadius: 22,
        background: '#FFFFFF',
        border: '2px solid rgba(212,175,55,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 42,
        fontWeight: 900,
        color: '#111827',
        marginBottom: 28,
        boxShadow: '0 8px 40px rgba(245,166,35,0.12)'
      }}>
        S
      </div>

      <h1 style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 22,
        fontWeight: 900,
        marginBottom: 10,
        color: '#111827',
      }}>
        {copy.title}
      </h1>

      <p style={{
        color: '#6B7280',
        maxWidth: 420,
        lineHeight: 1.65,
        marginBottom: 28,
        fontSize: 14
      }}>
        {copy.description}
      </p>

      {isDevelopment && technicalDetails && (
        <pre style={{
          maxWidth: 720,
          width: '100%',
          maxHeight: 260,
          overflow: 'auto',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: 16,
          borderRadius: 10,
          background: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FCA5A5',
          marginBottom: 24,
          fontSize: 12,
        }}>
          {technicalDetails}
        </pre>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {copy.buttons.map(renderButton)}
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const route = typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "unknown";
    console.error("[STEA ErrorBoundary] route crash", {
      route,
      message: error?.message || String(error || ""),
      code: error?.code || "unknown",
      stack: error?.stack || "",
      componentStack: errorInfo?.componentStack || "",
    });
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeErrorScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={() => {
            this.setState({ hasError: false, error: null, errorInfo: null });
            return true;
          }}
        />
      );
    }

    return this.props.children;
  }
}
