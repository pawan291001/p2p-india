export interface P2POrder {
  id: string;
  advertiser: string;
  completedTrades: number;
  completionRate: number;
  price: string;
  currency: string;
  crypto: string;
  available: string;
  minLimit: string;
  maxLimit: string;
  paymentMethods: string[];
  type: "buy" | "sell";
}

export const mockOrders: P2POrder[] = [
  {
    id: "1",
    advertiser: "CryptoKing_91",
    completedTrades: 1247,
    completionRate: 98.3,
    price: "1.002",
    currency: "USD",
    crypto: "USDT",
    available: "15,420.00",
    minLimit: "100",
    maxLimit: "5,000",
    paymentMethods: ["Bank Transfer", "PayPal", "Wise"],
    type: "buy",
  },
  {
    id: "2",
    advertiser: "TradeVault",
    completedTrades: 843,
    completionRate: 99.1,
    price: "0.998",
    currency: "USD",
    crypto: "USDT",
    available: "32,100.00",
    minLimit: "500",
    maxLimit: "25,000",
    paymentMethods: ["Bank Transfer", "Revolut"],
    type: "buy",
  },
  {
    id: "3",
    advertiser: "SwiftExchange",
    completedTrades: 2103,
    completionRate: 97.8,
    price: "1.005",
    currency: "USD",
    crypto: "USDT",
    available: "8,750.00",
    minLimit: "50",
    maxLimit: "2,000",
    paymentMethods: ["UPI", "Google Pay", "Bank Transfer"],
    type: "buy",
  },
  {
    id: "4",
    advertiser: "BlockMaster_X",
    completedTrades: 567,
    completionRate: 96.5,
    price: "43,215.80",
    currency: "USD",
    crypto: "BTC",
    available: "0.8432",
    minLimit: "200",
    maxLimit: "10,000",
    paymentMethods: ["Bank Transfer", "Wise", "PayPal"],
    type: "buy",
  },
  {
    id: "5",
    advertiser: "P2P_Whale",
    completedTrades: 3421,
    completionRate: 99.4,
    price: "1.001",
    currency: "USD",
    crypto: "USDT",
    available: "78,300.00",
    minLimit: "1,000",
    maxLimit: "50,000",
    paymentMethods: ["Bank Transfer"],
    type: "sell",
  },
  {
    id: "6",
    advertiser: "SafeTrade_22",
    completedTrades: 412,
    completionRate: 95.2,
    price: "0.999",
    currency: "USD",
    crypto: "USDT",
    available: "5,600.00",
    minLimit: "100",
    maxLimit: "3,000",
    paymentMethods: ["UPI", "Bank Transfer", "Google Pay"],
    type: "sell",
  },
  {
    id: "7",
    advertiser: "EtherFlow",
    completedTrades: 1892,
    completionRate: 98.7,
    price: "3,412.50",
    currency: "USD",
    crypto: "ETH",
    available: "12.45",
    minLimit: "100",
    maxLimit: "15,000",
    paymentMethods: ["Bank Transfer", "Revolut", "Wise"],
    type: "buy",
  },
  {
    id: "8",
    advertiser: "QuickSwap_Pro",
    completedTrades: 678,
    completionRate: 97.1,
    price: "1.003",
    currency: "USD",
    crypto: "USDT",
    available: "22,800.00",
    minLimit: "200",
    maxLimit: "8,000",
    paymentMethods: ["PayPal", "Wise", "Revolut"],
    type: "sell",
  },
];
