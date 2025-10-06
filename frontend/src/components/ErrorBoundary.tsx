import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to structured logging system
    if (typeof window !== 'undefined') {
      // Client-side error reporting
      console.error('React Error Boundary:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({
      error,
      errorInfo,
    });

    // W produkcji wysłalibyśmy to do service'u logowania błędów
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Symulacja wysyłania błędu do external service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    };

    // W rzeczywistej aplikacji:
    // await errorReportingService.report(errorReport);
    console.log('Error reported:', errorReport);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="content-inner">
          <div className="page-header page-header-light shadow">
            <div className="page-header-content d-lg-flex">
              <div className="d-flex">
                <h4 className="page-title mb-0">
                  Wystąpił błąd -{' '}
                  <span className="fw-normal">ThinkCode AI</span>
                </h4>
              </div>
            </div>
          </div>

          <div className="content">
            <div className="row justify-content-center">
              <div className="col-xl-8 col-lg-10">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="ph-warning-circle display-1 text-danger mb-4"></i>
                    <h3 className="mb-3">Ups! Coś poszło nie tak</h3>
                    <p className="text-muted mb-4">
                      Wystąpił nieoczekiwany błąd w aplikacji. Nasz zespół
                      został automatycznie powiadomiony.
                    </p>

                    <div className="d-flex justify-content-center gap-3 mb-4">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={this.handleRetry}
                      >
                        <i className="ph-arrow-clockwise me-2"></i>
                        Spróbuj ponownie
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={this.handleReload}
                      >
                        <i className="ph-browser me-2"></i>
                        Odśwież stronę
                      </button>
                    </div>

                    {process.env.NODE_ENV === 'development' &&
                      this.state.error && (
                        <details className="text-start">
                          <summary className="btn btn-outline-secondary mb-3">
                            Szczegóły błędu (tryb deweloperski)
                          </summary>
                          <div className="bg-light p-3 rounded">
                            <h6>Błąd:</h6>
                            <pre className="small text-danger mb-3">
                              {this.state.error.toString()}
                            </pre>
                            {this.state.errorInfo && (
                              <>
                                <h6>Stack trace:</h6>
                                <pre className="small text-muted">
                                  {this.state.errorInfo.componentStack}
                                </pre>
                              </>
                            )}
                          </div>
                        </details>
                      )}

                    <div className="alert alert-info d-flex align-items-center mt-4">
                      <i className="ph-info me-3"></i>
                      <div className="text-start">
                        <strong>Co możesz zrobić:</strong>
                        <ul className="mb-0 mt-2">
                          <li>Sprawdź połączenie z internetem</li>
                          <li>Spróbuj odświeżyć stronę</li>
                          <li>
                            Jeśli problem się powtarza, skontaktuj się z pomocą
                            techniczną
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook dla funkcjonalnych komponentów do zgłaszania błędów
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('Error caught by useErrorHandler:', error);

    // W produkcji wysłalibyśmy to do service'u logowania błędów
    const errorReport = {
      message: error.message,
      stack: error.stack,
      additionalInfo: errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    };

    console.log('Error reported via hook:', errorReport);

    // Możemy też pokazać toast notification
    // toast.error('Wystąpił błąd. Spróbuj ponownie.');
  };

  return { handleError };
};

export default ErrorBoundary;
