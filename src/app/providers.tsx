'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'wagmi/chains';
import { Toaster } from 'react-hot-toast';
import { TPSLProvider } from '@/contexts/TPSLContext';

export const config = createConfig({
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmggwss0r007okw0cruiaq7ut"
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <TPSLProvider>
            <Toaster
              position="top-right"
              containerStyle={{
                top: 20,
                right: 20,
                zIndex: 9999,
              }}
              toastOptions={{
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  pointerEvents: 'auto',
                },
                duration: 1500,
              }}
              containerClassName="toast-container"
              gutter={8}
              reverseOrder={false}
              limit={4}
            />
            {children}
          </TPSLProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
