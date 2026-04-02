import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  okxWallet,
  trustWallet,
  coinbaseWallet,
  phantomWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { bsc } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Crypto P2P",
  projectId: "demo_project_id", // Replace with your WalletConnect project ID
  chains: [bsc],
  ssr: false,
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, okxWallet, trustWallet, coinbaseWallet, walletConnectWallet],
    },
    {
      groupName: "More",
      wallets: [phantomWallet, injectedWallet],
    },
  ],
});

// Contract address — replace after deploying
export const P2P_CONTRACT_ADDRESS = "0xd79ef02e1F64EF4368b942020129bd0Bc7da0d95" as const;

// BSC Mainnet USDT
export const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955" as const;

export const SUPPORTED_TOKENS = [
  { symbol: "BNB", address: null, decimals: 18, icon: "🔶" },
  { symbol: "USDT", address: USDT_ADDRESS, decimals: 18, icon: "💵" },
] as const;
