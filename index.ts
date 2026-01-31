import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface User {
  address: string;
  emailHash?: string;
  subscriptionTier: number;
  subscriptionExpires: number;
  monthlyVolume: number;
  productsCreated: number;
  isVerified: boolean;
  createdAt: number;
}

export interface Product {
  id: string;
  creator: string;
  name: string;
  description: string;
  category: string;
  metadataIpfs: string;
  imageIpfs: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  manufacturer: string;
  originLocation: string;
  batchNumber: string;
  createdAt: number;
  verificationCount: number;
  isVerified: boolean;
}

export interface EscrowContract {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  productId: string;
  amount: number;
  state: number;
  createdAt: number;
  acceptedAt: number;
  completedAt: number;
  terms: string;
  trackingUpdates: TrackingUpdate[];
}

export interface TrackingUpdate {
  timestamp: number;
  location: string;
  status: string;
  updatedBy: string;
}

export interface Balance {
  SUI: number;
  cNGN: number;
  BTC: number;
  ETH: number;
  SOL: number;
  USDC: number;
  USDT: number;
}

export interface ExchangeRates {
  SUI: { usd: number; change24h: number };
  cNGN: { usd: number; change24h: number };
  BTC: { usd: number; change24h: number };
  ETH: { usd: number; change24h: number };
  SOL: { usd: number; change24h: number };
  USDC: { usd: number; change24h: number };
  USDT: { usd: number; change24h: number };
}

export interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  currency: string;
  productId?: string;
  escrowId?: string;
  timestamp: number;
  status: string;
  txHash: string;
}

interface AppState {
  // User & Authentication
  user: User | null;
  isAuthenticated: boolean;
  zkLoginData: any | null;
  
  // Wallet
  walletAddress: string | null;
  balances: Balance;
  selectedCurrency: string;
  
  // Market Data
  exchangeRates: ExchangeRates;
  portfolioValue: number;
  
  // Products & Escrows
  products: Product[];
  escrows: EscrowContract[];
  transactions: Transaction[];
  
  // UI State
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  currentSection: string;
  isLoading: boolean;
  notifications: any[];
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setZkLoginData: (data: any) => void;
  setWalletAddress: (address: string | null) => void;
  setBalances: (balances: Partial<Balance>) => void;
  setSelectedCurrency: (currency: string) => void;
  setExchangeRates: (rates: Partial<ExchangeRates>) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  setEscrows: (escrows: EscrowContract[]) => void;
  addEscrow: (escrow: EscrowContract) => void;
  updateEscrow: (id: string, updates: Partial<EscrowContract>) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCurrentSection: (section: string) => void;
  setIsLoading: (loading: boolean) => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  calculatePortfolioValue: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  zkLoginData: null,
  walletAddress: null,
  balances: {
    SUI: 0,
    cNGN: 0,
    BTC: 0,
    ETH: 0,
    SOL: 0,
    USDC: 0,
    USDT: 0,
  },
  selectedCurrency: 'SUI',
  exchangeRates: {
    SUI: { usd: 0, change24h: 0 },
    cNGN: { usd: 0.0016, change24h: 0 }, // ~600 NGN to 1 USD
    BTC: { usd: 0, change24h: 0 },
    ETH: { usd: 0, change24h: 0 },
    SOL: { usd: 0, change24h: 0 },
    USDC: { usd: 1.0, change24h: 0 },
    USDT: { usd: 1.0, change24h: 0 },
  },
  portfolioValue: 0,
  products: [],
  escrows: [],
  transactions: [],
  theme: 'dark' as const,
  sidebarOpen: true,
  currentSection: 'dashboard',
  isLoading: false,
  notifications: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setZkLoginData: (zkLoginData) => set({ zkLoginData }),
      
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      
      setBalances: (balances) =>
        set((state) => ({
          balances: { ...state.balances, ...balances },
        })),
      
      setSelectedCurrency: (selectedCurrency) => set({ selectedCurrency }),
      
      setExchangeRates: (rates) =>
        set((state) => ({
          exchangeRates: { ...state.exchangeRates, ...rates },
        })),
      
      setProducts: (products) => set({ products }),
      
      addProduct: (product) =>
        set((state) => ({
          products: [product, ...state.products],
        })),
      
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      
      setEscrows: (escrows) => set({ escrows }),
      
      addEscrow: (escrow) =>
        set((state) => ({
          escrows: [escrow, ...state.escrows],
        })),
      
      updateEscrow: (id, updates) =>
        set((state) => ({
          escrows: state.escrows.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      
      setTransactions: (transactions) => set({ transactions }),
      
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),
      
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        set({ theme: newTheme });
      },
      
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setCurrentSection: (currentSection) => set({ currentSection }),
      
      setIsLoading: (isLoading) => set({ isLoading }),
      
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      
      calculatePortfolioValue: () => {
        const { balances, exchangeRates } = get();
        let total = 0;
        
        Object.entries(balances).forEach(([currency, amount]) => {
          const rate = exchangeRates[currency as keyof ExchangeRates];
          if (rate) {
            total += amount * rate.usd;
          }
        });
        
        set({ portfolioValue: total });
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'thalexa-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        selectedCurrency: state.selectedCurrency,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
