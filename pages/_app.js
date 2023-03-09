import '@/css/tailwind.css'
import '@/css/prism.css'
import 'katex/dist/katex.css'

import '@fontsource/inter/variable-full.css'

import { ThemeProvider } from 'next-themes'
// import Head from 'next/head'

// import siteMetadata from '@/data/siteMetadata'
// import Analytics from '@/components/analytics'
// import LayoutWrapper from '@/components/LayoutWrapper'
// import { ClientReload } from '@/components/ClientReload'

// const isDevelopment = process.env.NODE_ENV === 'development'
// const isSocket = process.env.SOCKET

// export default function App({ Component, pageProps }) {
//   return (
//     <ThemeProvider attribute="class" defaultTheme={siteMetadata.theme}>
//       <Head>
//         <meta content="width=device-width, initial-scale=1" name="viewport" />
//       </Head>
//       {isDevelopment && isSocket && <ClientReload />}
//       <Analytics />
//       <LayoutWrapper>
//         <Component {...pageProps} />
//       </LayoutWrapper>
//     </ThemeProvider>
//   )
// }
import Head from 'next/head'
import { useRouter } from 'next/router'
import Script from 'next/script'
import { useEffect } from 'react'
import * as gtag from '../lib/gtag'

const App = ({ Component, pageProps }) => {
  const router = useRouter()
  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gtag.GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </Head>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
      />
      <Component {...pageProps} />
    </>
  )
}

export default App
