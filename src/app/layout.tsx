import type { Metadata } from 'next'
import { Inter, Syne, DM_Sans } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { ThemeProvider } from 'next-themes'
import { UserProvider } from '@/contexts/UserContext'
import { BrandThemeProvider } from '@/contexts/BrandThemeContext'
import { UIThemeProvider } from '@/contexts/UIThemeContext'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AgencyOS · System dla agencji marketingowej',
  description: 'CRM, outreach AI, generator treści i finanse dla polskich agencji marketingowych',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${inter.variable} ${syne.variable} ${dmSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* FOWT prevention — reads localStorage before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('h14-theme');var r=document.documentElement;if(t==='arctic-executive'){r.setAttribute('data-theme','arctic-executive');r.classList.add('light');r.classList.remove('dark');}else{r.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <UIThemeProvider>
            <BrandThemeProvider>
              <UserProvider>
                {children}
              </UserProvider>
            </BrandThemeProvider>
          </UIThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
