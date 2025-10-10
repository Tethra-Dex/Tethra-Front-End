'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'wagmi/chains';
import { Toaster } from 'react-hot-toast';

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
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
              },
            }}
          />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}