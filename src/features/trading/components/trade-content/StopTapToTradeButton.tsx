import React from 'react';

interface StopTapToTradeButtonProps {
  onStop: () => void;
}

export default function StopTapToTradeButton({ onStop }: StopTapToTradeButtonProps) {
  return (
    <button
      onClick={onStop}
      className="w-full py-3.5 font-semibold text-sm bg-short text-text-primary hover:bg-short-hover transition-colors flex items-center justify-center gap-2"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="6" y="6" width="12" height="12" />
      </svg>
      Stop Tap to Trade
    </button>
  );
}
