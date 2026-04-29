import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import AppSidebar from "@/components/AppSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Learnchain",
  description: "Amar Sankar Maitra",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-main text-text-main overflow-x-hidden transition-colors duration-300`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                  // user requested light, but default is dark. Since default is dark, we'll only check localStorage
                  if (localStorage.getItem('theme') === 'light') {
                    document.documentElement.classList.add('light');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
        <div className="fixed top-0 right-0 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[var(--purple-glow)] blur-[120px] rounded-full pointer-events-none -translate-y-1/3 translate-x-1/3 z-0 transition-colors duration-500" />
        <AppSidebar />
        <div className="pt-16 md:pt-0 md:pl-20 lg:pl-64 relative z-10 min-h-screen">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
