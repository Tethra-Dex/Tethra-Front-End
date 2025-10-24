"use client";

import React, { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "react-hot-toast";
import { DollarSign } from "lucide-react";
import { USDC_ADDRESS } from "@/config/contracts";
import { encodeFunctionData } from "viem";

// Mock USDC ABI with faucet function
const MOCK_USDC_ABI = [
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const ClaimUSDCButton: React.FC = () => {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimUSDC = async () => {
    if (!authenticated || !user) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Get embedded wallet
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    if (!embeddedWallet) {
      toast.error("Embedded wallet not found");
      return;
    }

    const walletAddress = embeddedWallet.address;

    setIsClaiming(true);
    const loadingToast = toast.loading("Claiming USDC from faucet...");

    try {
      // Get wallet provider
      const provider = await embeddedWallet.getEthereumProvider();
      if (!provider) {
        throw new Error("Could not get wallet provider");
      }

      // Encode faucet() function call
      const data = encodeFunctionData({
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
        args: [],
      });

      // Send transaction to call faucet()
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: USDC_ADDRESS,
            data: data,
          },
        ],
      });

      console.log("Faucet transaction sent:", txHash);

      toast.success(`USDC claimed successfully! 🎉`, {
        id: loadingToast,
        duration: 4000,
      });

      // Show transaction link
      setTimeout(() => {
        toast.success(
          <div>
            View on Explorer:{" "}
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Click here
            </a>
          </div>,
          { duration: 5000 }
        );
      }, 500);

      // Reload the page to refresh balance
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Error claiming USDC:", error);

      let errorMessage = "Failed to claim USDC from faucet";

      if (error?.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (!authenticated) {
    return null;
  }

  return (
    <button
      onClick={handleClaimUSDC}
      disabled={isClaiming}
      className="hidden xl:flex items-center gap-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
      title="Claim 100 Mock USDC"
    >
      <DollarSign className="w-5 h-5" />
      {isClaiming ? "Claiming..." : "Claim USDC"}
    </button>
  );
};

export default ClaimUSDCButton;
