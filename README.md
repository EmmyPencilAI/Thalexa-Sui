# Thalexa V2 - Decentralized Supply Chain Verification & Escrow Platform

## Overview

Thalexa is a blockchain-powered verification platform built on **Sui** that allows businesses to register products, attach immutable metadata, and enable public authenticity verification through QR codes or links. It replaces manual verification, paperwork, and trust assumptions with cryptographic proof and automated logic.

### Key Features

- ✅ **zkLogin Integration** - Passwordless authentication via Google, Facebook, Apple
- ✅ **Multi-Currency Support** - SUI, cNGN, BTC, ETH, SOL, USDC, USDT
- ✅ **Escrow System** - Secure payment release based on delivery confirmation
- ✅ **Product Verification** - QR code-based authenticity verification
- ✅ **IPFS Storage** - Decentralized file storage via Pinata
- ✅ **Subscription Tiers** - Starter (Free), Professional ($500/mo), Enterprise (Custom)
- ✅ **Cross-Device Support** - Responsive design for mobile, tablet, desktop, smartwatch
- ✅ **Real-time Tracking** - Track products through the supply chain
- ✅ **Dispute Resolution** - Built-in arbitration system

## Architecture

### Smart Contracts (Move)

Located in `/contracts/sources/`:

1. **thalexa_escrow.move** - Main escrow and product verification logic
2. **multi_currency.move** - Multi-currency support including cNGN

### Frontend (React + TypeScript)

Located in `/frontend/src/`:

- **React 18** with TypeScript
- **Sui dApp Kit** for blockchain interactions
- **Bootstrap 5** for responsive UI
- **Zustand** for state management
- **Chart.js** for analytics
- **QR Code** generation and scanning

### Backend API (Node.js/Vercel)

Located in `/backend/api/`:

- RESTful API for off-chain data
- Exchange rate oracle
- User preferences
- Analytics & reporting

## Getting Started

### Prerequisites

- Node.js 18+
- Sui CLI (`cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui`)
- Pinata account (for IPFS)
- Google/Facebook/Apple OAuth credentials (for zkLogin)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/EmmyPencilAI/thalexa-v2.git
cd thalexa-v2
```

#### 2. Deploy Smart Contracts

```bash
cd contracts

# Build contracts
sui move build

# Deploy to Sui mainnet
sui client publish --gas-budget 100000000

# Save the package ID from deployment output
```

#### 3. Configure Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values:
# VITE_PACKAGE_ID= Classified *****
# VITE_PINATA_API_KEY= Classified *****
# VITE_PINATA_SECRET_KEY= Classified *****
# VITE_GOOGLE_CLIENT_ID= Classified *****
# etc.
```

#### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

#### 5. Build for Production

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or your preferred hosting.

## Smart Contract Deployment

### Mainnet Deployment

```bash
sui client switch --env mainnet
sui client publish --gas-budget 100000000 --verify-dependencies
```

### Testnet Deployment (for testing)

```bash
sui client switch --env testnet
sui client publish --gas-budget 100000000
```

## Configuration

### Environment Variables

Create a `.env` file in `/frontend/`:

```env
# Network
VITE_SUI_NETWORK=mainnet
VITE_SUI_RPC=https://fullnode.mainnet.sui.io:443

# Contracts (update after deployment)
VITE_PACKAGE_ID=0x...
VITE_ESCROW_CONTRACT=0x...
VITE_MULTI_CURRENCY_CONTRACT=0x...

# zkLogin
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_CLIENT_ID=your-facebook-client-id
VITE_APPLE_CLIENT_ID=your-apple-client-id
VITE_ZKLOGIN_REDIRECT_URL=https://yourdomain.com/auth/callback

# Pinata IPFS
VITE_PINATA_API_KEY=your-pinata-api-key
VITE_PINATA_SECRET_KEY=your-pinata-secret-key
VITE_PINATA_JWT=your-pinata-jwt
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Backend API
VITE_BACKEND_URL=https://your-backend.vercel.app
```

## Subscription Tiers

### Starter (Free)

- Up to $2,000 in transfers per month
- Basic wallet & identity
- Transaction verification
- **No product registration**

### Professional ($500/month)

- $200,000 monthly volume
- 300 products per month
- QR codes & verification
- Escrow services
- API access
- Priority support

### Enterprise (Custom pricing)

- Unlimited volume
- Unlimited products
- Custom workflows
- Dedicated infrastructure
- White-label portals
- SLA & compliance

## Usage

### For Users

1. **Create Account**
   - Sign in with Google/Facebook/Apple (zkLogin)
   - Wallet created automatically

2. **View Balance**
   - Check SUI, cNGN, and other currency balances
   - Real-time exchange rates

3. **Make Transactions**
   - Send/receive payments
   - Track transaction history

### For Businesses (Professional/Enterprise)

1. **Register Products**
   - Upload product details & images
   - Metadata stored on IPFS
   - Smart contract created on-chain

2. **Generate QR Codes**
   - QR code links to product verification page
   - Print and attach to products

3. **Create Escrow**
   - Lock payment until delivery
   - Buyer confirms receipt
   - Automatic release

4. **Track Shipments**
   - Update product location
   - Real-time tracking
   - Delivery confirmation

### For Verifiers

1. **Scan QR Code**
   - Verify product authenticity
   - View product history
   - Check blockchain proof

## API Reference

### Product Creation

```typescript
const txb = new SuiTransactionBuilder();
txb.createProduct(accountId, {
  name: "Product Name",
  description: "Product description",
  category: "Electronics",
  metadataIpfs: "Qm...",
  imageIpfs: "Qm...",
  quantity: 100,
  unitPrice: 50_000_000_000, // 50 SUI in MIST
  currency: "SUI",
  manufacturer: "0x...",
  originLocation: "Lagos, Nigeria",
  batchNumber: "BATCH-001",
});

const result = await executeTransaction(txb.build(), signer);
```

### Escrow Creation

```typescript
const txb = new SuiTransactionBuilder();
txb.createEscrow(
  sellerAddress,
  arbiterAddress,
  productId,
  amount,
  "Delivery terms...",
  configId
);

const result = await executeTransaction(txb.build(), signer);
```

### Product Verification

```typescript
const txb = new SuiTransactionBuilder();
txb.verifyProduct(productId);

const result = await executeTransaction(txb.build(), signer);
```

## Testing

### Run Unit Tests

```bash
cd frontend
npm test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Test Smart Contracts

```bash
cd contracts
sui move test
```

## Deployment

### Frontend (Vercel)

```bash
npm run build
vercel --prod
```

### Backend (Vercel Serverless)

```bash
cd backend
vercel --prod
```

### Smart Contracts

```bash
cd contracts
sui client publish --gas-budget 100000000
```

## Security

- ✅ All sensitive data encrypted
- ✅ zkLogin for passwordless auth
- ✅ Escrow smart contracts audited
- ✅ IPFS for immutable storage
- ✅ Multi-signature support for enterprise
- ✅ Rate limiting on API endpoints

## Roadmap

### Phase 1 (Q1 2026) - ✅ Completed
- [x] Smart contract deployment on Sui mainnet
- [x] zkLogin integration
- [x] Multi-currency support (including cNGN)
- [x] Product registration & QR codes
- [x] Basic escrow system

### Phase 2 (Q2 2026)
- [ ] Mobile apps (iOS & Android)
- [ ] Smartwatch integration
- [ ] Advanced analytics dashboard
- [ ] Bulk product upload
- [ ] API marketplace

### Phase 3 (Q3 2026)
- [ ] White-label solutions
- [ ] Custom smart contract builder
- [ ] Cross-chain bridges
- [ ] AI-powered fraud detection
- [ ] Supply chain insurance

### Phase 4 (Q4 2026)
- [ ] Global expansion
- [ ] Enterprise partnerships
- [ ] Regulatory compliance tools
- [ ] Carbon footprint tracking
- [ ] Sustainability metrics

## Support

- **Email**: support@thalexa.io
- **Discord**: https://discord.gg/thalexa
- **Twitter**: @ThalexaOfficial
- **Documentation**: https://docs.thalexa.io

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Sui Foundation for blockchain infrastructure
- Mysten Labs for zkLogin technology
- Pinata for IPFS hosting
- CoinGecko for exchange rate data
- Community contributors

---

Built with ❤️ by the Thalexa Team

**Website**: https://thalexa.io  
**App**: https://app.thalexa.io  
**GitHub**: https://github.com/thalexa
