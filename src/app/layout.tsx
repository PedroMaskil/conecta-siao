import './globals.css'

export const metadata = {
  title: 'Conecta Sião',
  description: 'Sistema de gestão',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  )
}