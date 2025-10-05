import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Copilot Task Processor - Limitless Template</title>
        <meta
          name="description"
          content="Process tasks with AI assistance using beautiful Limitless template"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Limitless Template Stylesheets */}
        <link
          href="/limitless/css/bootstrap.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <link
          href="/limitless/css/bootstrap_limitless.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <link
          href="/limitless/css/layout.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <link
          href="/limitless/css/components.min.css"
          rel="stylesheet"
          type="text/css"
        />
        {/* Phosphor Icons */}
        <link
          href="/limitless/icons/phosphor/styles.min.css"
          rel="stylesheet"
          type="text/css"
        />
        {/* Additional Limitless JS (for dropdowns, etc) */}
        import 'bootstrap/dist/js/bootstrap.bundle.min.js' import
        '../public/custom-styles.css'
      </Head>
      <Component {...pageProps} />
    </>
  );
}
