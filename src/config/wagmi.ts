import { getDefaultConfig, getDefaultWallets } from "@rainbow-me/rainbowkit";
import {
  okxWallet,
  trustWallet,
  coinbaseWallet,
  phantomWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { bsc } from "wagmi/chains";

const { wallets: defaultWallets } = getDefaultWallets();

export const config = getDefaultConfig({
  appName: "Crypto P2P",
  projectId: "demo_project_id", // Replace with your WalletConnect project ID
  chains: [bsc],
  ssr: false,
  wallets: [
    ...defaultWallets,
    {
      groupName: "More Wallets",
      wallets: [okxWallet, trustWallet, coinbaseWallet, phantomWallet],
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
