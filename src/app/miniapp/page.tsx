'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export default function MiniAppPage() {
  useEffect(() => {
    // Notify Farcaster that the app is ready
    sdk.actions.ready()
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <iframe
        src="https://tethradex.vercel.app/trade"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
          display: 'block'
        }}
        title="TethraDEX Trading"
      />
    </div>
  )
}
