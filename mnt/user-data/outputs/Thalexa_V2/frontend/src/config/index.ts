// Thalexa Application Configuration
export const config = {
  // Network Configuration
  network: {
    sui: {
      network: 'mainnet', // Change to 'testnet' or 'devnet' for testing
      fullnode: 'https://fullnode.mainnet.sui.io:443',
      faucet: 'https://faucet.mainnet.sui.io/gas',
    },
    // Legacy support for bridging
    ethereum: {
      rpcUrl: process.env.VITE_ETHEREUM_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
      chainId: 11155111, // Sepolia testnet
    },
    solana: {
      rpcUrl: process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      cluster: 'mainnet-beta',
    },
  },

  // Contract Addresses (Update after deployment)
  contracts: {
    escrow: process.env.VITE_ESCROW_CONTRACT || '0x0', // Update with deployed address
    multiCurrency: process.env.VITE_MULTI_CURRENCY_CONTRACT || '0x0',
    packageId: process.env.VITE_PACKAGE_ID || '0x0',
  },

  // zkLogin Configuration
  zkLogin: {
    clientId: process.env.VITE_ZKLOGIN_CLIENT_ID || '',
    redirectUrl: process.env.VITE_ZKLOGIN_REDIRECT_URL || 'http://localhost:3000/auth/callback',
    providers: {
      google: {
        clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      },
      facebook: {
        clientId: process.env.VITE_FACEBOOK_CLIENT_ID || '',
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      },
      apple: {
        clientId: process.env.VITE_APPLE_CLIENT_ID || '',
        authUrl: 'https://appleid.apple.com/auth/authorize',
      },
    },
    saltServer: process.env.VITE_SALT_SERVER_URL || 'https://salt.api.mystenlabs.com/get_salt',
    proofServer: process.env.VITE_PROOF_SERVER_URL || 'https://prover.mystenlabs.com/v1',
  },

  // Pinata IPFS Configuration
  pinata: {
    apiKey: process.env.VITE_PINATA_API_KEY || '',
    secretKey: process.env.VITE_PINATA_SECRET_KEY || '',
    jwt: process.env.VITE_PINATA_JWT || '',
    gateway: process.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
    uploadEndpoint: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
    jsonEndpoint: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
  },

  // Supported Currencies
  currencies: {
    SUI: {
      name: 'Sui',
      symbol: 'SUI',
      decimals: 9,
      icon: '⛓️',
      color: '#4DA2FF',
      coingeckoId: 'sui',
    },
    cNGN: {
      name: 'Nigerian Naira Coin',
      symbol: 'cNGN',
      decimals: 6,
      icon: '🇳🇬',
      color: '#008751',
      coingeckoId: null, // Custom rate
      isStablecoin: true,
    },
    BTC: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
      icon: '₿',
      color: '#F7931A',
      coingeckoId: 'bitcoin',
      isWrapped: true,
    },
    ETH: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      icon: 'Ξ',
      color: '#627EEA',
      coingeckoId: 'ethereum',
      isWrapped: true,
    },
    SOL: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
      icon: '◎',
      color: '#14F195',
      coingeckoId: 'solana',
      isWrapped: true,
    },
    USDC: {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      icon: '$',
      color: '#2775CA',
      coingeckoId: 'usd-coin',
      isStablecoin: true,
    },
    USDT: {
      name: 'Tether',
      symbol: 'USDT',
      decimals: 6,
      icon: '₮',
      color: '#26A17B',
      coingeckoId: 'tether',
      isStablecoin: true,
    },
  },

  // Subscription Tiers
  subscriptionTiers: {
    STARTER: {
      id: 0,
      name: 'Starter',
      price: 0,
      features: [
        'Up to $2,000 in transfers per month',
        'Basic wallet creation & onchain identity',
        'Simple transaction verification',
        'Public transaction reference & lookup',
        'Standard blockchain network fees',
      ],
      limits: {
        monthlyVolume: 2000,
        productsPerMonth: 0,
        transactionsPerDay: 10,
      },
      color: '#6c757d',
    },
    PROFESSIONAL: {
      id: 1,
      name: 'Professional',
      price: 500,
      features: [
        '$200,000 monthly transaction volume',
        '300 products/assets per month',
        'Verified transaction + asset linkage',
        'QR codes for payments & product verification',
        'Escrow & conditional payment release',
        'Multi-wallet support',
        'API access',
        'Priority support',
        'Reduced transaction fees',
      ],
      limits: {
        monthlyVolume: 200000,
        productsPerMonth: 300,
        transactionsPerDay: 1000,
      },
      color: '#0d6efd',
    },
    ENTERPRISE: {
      id: 2,
      name: 'Enterprise',
      price: 2000,
      features: [
        'Unlimited transaction volume',
        'Unlimited products/assets',
        'Custom smart contracts & workflows',
        'Dedicated infrastructure & SLA',
        'Compliance-grade audit & reporting',
        'White-label portals',
        'Team permissions & controls',
        'Dedicated account manager',
        'Custom transaction pricing',
      ],
      limits: {
        monthlyVolume: Infinity,
        productsPerMonth: Infinity,
        transactionsPerDay: Infinity,
      },
      color: '#6610f2',
    },
  },

  // Platform Fee
  platformFee: {
    percentage: 2.5, // 2.5%
    minFee: 0.01, // Minimum fee in USD
    escrowFee: 1.0, // 1% for escrow services
  },

  // API Endpoints
  api: {
    backend: process.env.VITE_BACKEND_URL || 'https://thalexa-api.vercel.app',
    coingecko: 'https://api.coingecko.com/api/v3',
    exchangeRates: 'https://api.exchangerate-api.com/v4/latest/USD',
  },

  // Application Settings
  app: {
    name: 'Thalexa',
    version: '2.0.0',
    description: 'Decentralized Supply Chain Verification & Escrow Platform',
    supportEmail: 'support@thalexa.io',
    marketDataUpdateInterval: 60000, // 1 minute
    transactionTimeout: 30000, // 30 seconds
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    qrCodeSize: 300,
    defaultTheme: 'dark',
  },

  // Product Categories
  productCategories: [
    'Agriculture',
    'Pharmaceutical',
    'Luxury Goods',
    'Electronics',
    'Fashion & Apparel',
    'Food & Beverage',
    'Automotive',
    'Industrial Equipment',
    'Art & Collectibles',
    'Other',
  ],

  // Escrow States
  escrowStates: {
    0: { label: 'Pending', color: 'warning', icon: '⏳' },
    1: { label: 'Accepted', color: 'info', icon: '✅' },
    2: { label: 'In Transit', color: 'primary', icon: '🚚' },
    3: { label: 'Delivered', color: 'success', icon: '📦' },
    4: { label: 'Completed', color: 'success', icon: '✔️' },
    5: { label: 'Disputed', color: 'danger', icon: '⚠️' },
    6: { label: 'Cancelled', color: 'secondary', icon: '❌' },
  },

  // Notification Settings
  notifications: {
    position: 'top-right',
    duration: 5000,
    types: {
      success: { icon: '✅', color: '#28a745' },
      error: { icon: '❌', color: '#dc3545' },
      warning: { icon: '⚠️', color: '#ffc107' },
      info: { icon: 'ℹ️', color: '#17a2b8' },
    },
  },

  // Responsive Breakpoints
  breakpoints: {
    mobile: 576,
    tablet: 768,
    desktop: 992,
    wide: 1200,
    ultrawide: 1400,
  },
};

export default config;
