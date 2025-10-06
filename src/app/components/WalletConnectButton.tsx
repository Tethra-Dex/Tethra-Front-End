'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

const WalletConnectButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="wallet-info">
        <span>{`Connected: ${address.substring(0, 6)}...${address.substring(
          address.length - 4
        )}`}</span>
        <button
          onClick={() => disconnect()}
          className="wallet-button disconnect"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="wallet-button connect"
    >
      Connect Wallet
    </button>
  );
};

export default WalletConnectButton;