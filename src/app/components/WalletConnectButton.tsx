/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSwitchChain, useChainId } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { toast } from "react-hot-toast";
import { Copy, ExternalLink, LogOut, Wallet, Key, DollarSign } from "lucide-react";
import { createPublicClient, http, formatUnits, encodeFunctionData } from "viem";
import { USDC_ADDRESS, USDC_DECIMALS } from "@/config/contracts";

// Mock USDC ABI with faucet function
const MOCK_USDC_ABI = [
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "hasClaimed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const WalletConnectButton: React.FC = () => {
  const {
    ready,
    authenticated,
    login,
    logout,
    user,
    exportWallet,
    createWallet,
  } = usePrivy();
  const { wallets } = useWallets();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-create embedded wallet when user connects with external wallet
  useEffect(() => {
    const autoCreateEmbeddedWallet = async () => {
      if (!authenticated || !user) return;

      // Check if user has embedded wallet
      const embeddedWallets = user.linkedAccounts?.filter(
        (account: any) =>
          account.type === "wallet" &&
          account.imported === false &&
          account.id !== undefined
      );

      // If no embedded wallet exists, create one automatically
      if (!embeddedWallets || embeddedWallets.length === 0) {
        console.log("No embedded wallet found, auto-creating...");
        toast.loading("Setting up your embedded wallet...", {
          id: "auto-create",
        });

        try {
          await createWallet();
          toast.success("Embedded wallet created successfully!", {
            id: "auto-create",
            duration: 3000,
          });
        } catch (error: any) {
          console.error("Auto-create wallet error:", error);

          // Ignore error if wallet already exists
          if (error?.message?.includes("already has")) {
            toast.dismiss("auto-create");
          } else {
            toast.error("Failed to create embedded wallet", {
              id: "auto-create",
            });
          }
        }
      }
    };

    autoCreateEmbeddedWallet();
  }, [authenticated, user, createWallet]);

  // Auto-switch to Base when authenticated
  useEffect(() => {
    if (authenticated && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
      toast.success("Switching to Base Sepolia network...");
    }
  }, [authenticated, chainId, switchChain]);

  // Fetch USDC balance
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!authenticated || !user) return;

      // Get embedded wallet address
      const embeddedWallets = user.linkedAccounts?.filter(
        (account: any) =>
          account.type === "wallet" &&
          account.imported === false &&
          account.id !== undefined
      ) as any[];

      const embeddedWalletAddress =
        embeddedWallets?.[0]?.address || user?.wallet?.address;

      if (!embeddedWalletAddress) return;

      setIsLoadingBalance(true);
      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const balance = (await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: [
            {
              constant: true,
              inputs: [{ name: "_owner", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "balance", type: "uint256" }],
              type: "function",
            },
          ],
          functionName: "balanceOf",
          args: [embeddedWalletAddress as `0x${string}`],
        })) as bigint;

        // Format USDC balance using configured decimals
        const formattedBalance = formatUnits(balance, USDC_DECIMALS);
        setUsdcBalance(parseFloat(formattedBalance).toFixed(2));
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
        setUsdcBalance("0.00");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (authenticated && user) {
      fetchUsdcBalance();
    }
  }, [authenticated, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is inside Privy modal (Privy modals have specific classes/attributes)
      const isPrivyModal =
        target.closest('[role="dialog"]') ||
        target.closest(".privy-modal") ||
        target.closest("#privy-modal-content");

      // Don't close if clicking inside Privy modal
      if (isPrivyModal) {
        return;
      }

      // Close only if clicking outside our dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const getEmbeddedWalletAddress = () => {
    const embeddedWallets = user?.linkedAccounts?.filter(
      (account: any) =>
        account.type === "wallet" &&
        account.imported === false &&
        account.id !== undefined
    ) as any[];
    return embeddedWallets?.[0]?.address || user?.wallet?.address;
  };

  const handleCopyAddress = () => {
    const address = getEmbeddedWalletAddress();
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied!");
      // Don't close the dropdown - keep it open for user convenience
    }
  };

  const handleViewExplorer = () => {
    const address = getEmbeddedWalletAddress();
    if (address) {
      window.open(`https://sepolia.basescan.org/address/${address}`, "_blank");
      // Don't close the dropdown - keep it open for user convenience
    }
  };

  const handleExportPrivateKey = async () => {
    try {
      // Find embedded wallet
      const embeddedWallets = user?.linkedAccounts?.filter(
        (account: any) =>
          account.type === "wallet" &&
          account.imported === false &&
          account.id !== undefined
      ) as any[];

      // Check if user has embedded wallet
      if (!embeddedWallets || embeddedWallets.length === 0) {
        toast.error("Embedded wallet not found. Please reconnect your wallet.");
        return;
      }

      // Get the embedded wallet address
      const embeddedWalletAddress = embeddedWallets[0]?.address;

      if (!embeddedWalletAddress) {
        toast.error("Embedded wallet address not found");
        return;
      }

      // Export the specific embedded wallet by passing its address
      // This will open Privy's modal for private key export
      await exportWallet({ address: embeddedWalletAddress });

      // Don't close the dropdown - keep wallet popup open after Privy modal closes
      // User might want to do other actions
      toast.success("Private key exported successfully!");
    } catch (error: any) {
      console.error("Error exporting wallet:", error);
      toast.error(error?.message || "Failed to export private key");
    }
  };

  const handleDisconnect = () => {
    logout();
    setIsDropdownOpen(false);
    toast.success("Wallet disconnected");
  };

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
    const loadingToast = toast.loading("Checking claim status...");

    try {
      // Get wallet provider
      const provider = await embeddedWallet.getEthereumProvider();
      if (!provider) {
        throw new Error("Could not get wallet provider");
      }

      // Check if user has already claimed
      const hasClaimedData = encodeFunctionData({
        abi: MOCK_USDC_ABI,
        functionName: "hasClaimed",
        args: [walletAddress as `0x${string}`],
      });

      const hasClaimedResult = await provider.request({
        method: "eth_call",
        params: [
          {
            to: USDC_ADDRESS,
            data: hasClaimedData,
          },
          "latest",
        ],
      });

      // Parse the result (0x0000...0001 = true, 0x0000...0000 = false)
      const alreadyClaimed = hasClaimedResult !== "0x0000000000000000000000000000000000000000000000000000000000000000";

      if (alreadyClaimed) {
        toast.error(
          "You have already claimed USDC from the faucet. Each wallet can only claim once.",
          {
            id: loadingToast,
            duration: 5000,
          }
        );
        return;
      }

      // Update loading message
      toast.loading("Claiming USDC from faucet...", { id: loadingToast });

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

  if (!ready) {
    return null;
  }

  if (authenticated) {
    // Get embedded wallet address
    const embeddedWallets = user?.linkedAccounts?.filter(
      (account: any) =>
        account.type === "wallet" &&
        account.imported === false &&
        account.id !== undefined
    ) as any[];

    const embeddedWalletAddress =
      embeddedWallets?.[0]?.address || user?.wallet?.address;
    const shortAddress = embeddedWalletAddress
      ? `${embeddedWalletAddress.substring(
          0,
          6
        )}...${embeddedWalletAddress.substring(
          embeddedWalletAddress.length - 4
        )}`
      : "Connected";

    return (
      <div className="flex items-center">
        {/* Connect Wallet Button with Wallet Icon */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
        >
          <Wallet className="w-5 h-5" />
          {shortAddress}
        </button>

        {/* Base Network Button */}
        <div className="relative group ml-3">
          <button
            className="flex items-center justify-center w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="Sepolia Base"
          >
            <img
              src="data:image/svg+xml,%3Csvg width='111' height='111' viewBox='0 0 111 111' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z' fill='%230052FF'/%3E%3C/svg%3E"
              alt="Base"
              className="w-6 h-6"
            />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Sepolia Base
          </div>
        </div>

        {/* Modal Overlay */}
        {isDropdownOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Modal Content */}
            <div
              ref={dropdownRef}
              className="relative w-[520px] bg-[#16181D] rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Header Section */}
              <div className="px-6 py-5 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-100">
                    Tethra Wallet
                  </h2>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 hover:cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Wallet Address with Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Address Box */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-800/50 rounded-xl flex-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-slate-100 font-medium text-sm">
                      {shortAddress}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-slate-700/50 rounded-md transition-colors ml-auto cursor-pointer"
                      title="Copy Address"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
                    </button>
                  </div>

                  {/* Action Icon Buttons - Separated */}
                  <button
                    onClick={handleViewExplorer}
                    className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  </button>

                  <button
                    onClick={handleExportPrivateKey}
                    className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
                    title="Export Private Key"
                  >
                    <Key className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="p-2.5 bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer"
                    title="Disconnect"
                  >
                    <LogOut className="w-4 h-4 text-white hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Balance Section */}
              <div className="px-6 py-5 border-b border-slate-700/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span>Balance</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        $
                      </span>
                    </div>
                    <span className="text-slate-100 text-sm font-medium">
                      USDC
                    </span>
                    <svg
                      className="w-3.5 h-3.5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="text-4xl font-bold text-slate-100 mb-5">
                  {isLoadingBalance ? (
                    <span className="text-slate-400 text-2xl">Loading...</span>
                  ) : (
                    <span>${usdcBalance || "0.00"}</span>
                  )}
                </div>

                {/* Deposit, Withdraw & Claim USDC Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button className="py-3 px-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-100 font-medium transition-colors cursor-pointer">
                    Deposit
                  </button>
                  <button className="py-3 px-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-100 font-medium transition-colors cursor-pointer">
                    Withdraw
                  </button>
                  <button
                    onClick={handleClaimUSDC}
                    disabled={isClaiming}
                    className="py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                    title="Claim 100 Mock USDC"
                  >
                    <DollarSign className="w-4 h-4" />
                    {isClaiming ? "Claiming..." : "Claim"}
                  </button>
                </div>
              </div>

              {/* Funding Activity Section */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-100 mb-3">
                  Funding Activity
                </h3>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-slate-600 transition-colors"
                  />
                  <svg
                    className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Empty State */}
                <div className="py-8 text-center">
                  <p className="text-slate-500 text-sm">
                    No funding activity yet
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {/* Connect Wallet Button with Wallet Icon */}

      <button
        onClick={login}
        className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg md:px-5 px-3 md:py-3 py-1 text-base font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
      >
        <Wallet className="w-5 h-5" />
        Connect wallet
      </button>

      {/* Base Network Button */}
      <div className="relative group">
        <button
          className="flex items-center justify-center w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          title="Sepolia Base"
        >
          <img
            src="data:image/svg+xml,%3Csvg width='111' height='111' viewBox='0 0 111 111' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z' fill='%230052FF'/%3E%3C/svg%3E"
            alt="Base"
            className="w-6 h-6"
          />
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Sepolia Base
        </div>
      </div>
    </div>
  );
};

export default WalletConnectButton;
