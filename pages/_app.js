import { ThemeProvider } from 'next-themes'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider defaultTheme="system" attribute="data-theme">
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
