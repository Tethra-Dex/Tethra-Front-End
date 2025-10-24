export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
