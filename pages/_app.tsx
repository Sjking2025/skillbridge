import { ThemeProvider } from 'next-themes'
import { Fraunces, DM_Sans } from 'next/font/google'
import '../styles/globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export default function App({ Component, pageProps }: any) {
  return (
    <ThemeProvider defaultTheme="system" attribute="data-theme">
      <main className={`${fraunces.variable} ${dmSans.variable}`}>
        <Component {...pageProps} />
      </main>
    </ThemeProvider>
  )
}
