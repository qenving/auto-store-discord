import './globals.css'

export const metadata = {
  title: 'Auto-Store - Management System',
  description: 'Auto-Store Management Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
