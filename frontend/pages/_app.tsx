import type { AppProps } from 'next/app';
import Head from 'next/head';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Global styles
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>ThinkCode AI Platform</title>
        <meta
          name="description"
          content="Advanced AI-powered task processing and document generation system"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </>
  );
}
