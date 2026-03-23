import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

const projectId = "3ef393fe57a55a8cb6d4f1247d55b0f5"; // 👈 paste here

export const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    name: "ARC",
    symbol: "ARC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
};

export const config = getDefaultConfig({
  appName: "Veero",
  projectId,
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
});