import type { Metadata } from "next"
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
})

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Vizinho — serviços locais com reputação",
  description:
    "Marketplace intermediador entre clientes e prestadores de serviços do bairro, com geolocalização, chat e pagamento retido.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
