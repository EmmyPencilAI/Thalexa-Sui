# 📋 Thalexa V2 Quick Reference

## ⚡ Quick Commands

### Smart Contracts
```bash
# Build contracts
cd contracts && sui move build

# Test contracts
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000

# Deploy to mainnet
sui client switch --env mainnet
sui client publish --gas-budget 100000000
```

### Frontend
```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup
```bash
# Create .env file
cat > frontend/.env << EOF
VITE_SUI_NETWORK=mainnet
VITE_PACKAGE_ID=your_package_id
VITE_PINATA_JWT=your_pinata_jwt
VITE_GOOGLE_CLIENT_ID=your_google_client_id
EOF
```

## 📦 Key Files Reference

| File | Purpose | LOC |
|------|---------|-----|
| `contracts/sources/thalexa_escrow.move` | Main escrow logic | 600+ |
| `contracts/sources/multi_currency.move` | Currency support | 400+ |
| `frontend/src/utils/sui.ts` | Sui blockchain | 380+ |
| `frontend/src/utils/zkLogin.ts` | Authentication | 280+ |
| `frontend/src/utils/pinata.ts` | IPFS storage | 320+ |
| `frontend/src/store/index.ts` | State management | 280+ |
| `frontend/src/config/index.ts` | Configuration | 300+ |

## 🔧 Configuration Checklist

### Required for Testnet
- [ ] Sui wallet with testnet SUI
- [ ] Pinata account (free tier)
- [ ] Google OAuth credentials

### Required for Mainnet
- [ ] Sui wallet with mainnet SUI (~5 SUI)
- [ ] Pinata paid plan ($20/month)
- [ ] Production OAuth credentials
- [ ] Domain name
- [ ] Vercel account

## 🎯 Smart Contract Functions

### User Management
```move
create_account(email_hash)
upgrade_subscription(account, payment, tier)
```

### Product Management
```move
create_product(account, product_data)
verify_product(product_id)
```

### Escrow Operations
```move
create_escrow(seller, arbiter, product_id, amount, terms)
accept_escrow(escrow_id)
update_tracking(escrow_id, location, status)
complete_escrow(escrow_id)
dispute_escrow(escrow_id)
resolve_dispute(escrow_id, release_to_seller)
```

### Currency Operations
```move
mint_cngn(treasury_cap, amount, recipient)
create_wallet()
deposit_cngn(wallet, coin)
withdraw_cngn(wallet, amount)
transfer_cngn(sender_wallet, receiver, amount)
update_exchange_rate(oracle, currency, rate)
```

## 💡 Common Operations

### Create User Account
```typescript
import { SuiTransactionBuilder } from './utils/sui';

const txb = new SuiTransactionBuilder();
txb.createAccount(emailHash);
const result = await executeTransaction(txb.build(), signer);
```

### Create Product
```typescript
// Upload image to IPFS
const imageHash = await uploadProductImage(imageFile, productName);

// Upload metadata to IPFS
const metadataHash = await uploadProductMetadata(productData);

// Create on-chain product
const txb = new SuiTransactionBuilder();
txb.createProduct(accountId, {
  name,
  description,
  category,
  metadataIpfs: metadataHash,
  imageIpfs: imageHash,
  quantity,
  unitPrice,
  currency,
  manufacturer,
  originLocation,
  batchNumber,
});
const result = await executeTransaction(txb.build(), signer);
```

### Create Escrow
```typescript
const txb = new SuiTransactionBuilder();
txb.createEscrow(
  sellerAddress,
  arbiterAddress,
  productId,
  amount,
  "Delivery upon confirmation",
  configId
);
const result = await executeTransaction(txb.build(), signer);
```

### zkLogin Authentication
```typescript
import { initializeZkLogin } from './utils/zkLogin';

// Start OAuth flow
const { authUrl, ephemeralKeyPair, nonce, randomness } = 
  await initializeZkLogin('google', maxEpoch);

// Redirect user
window.location.href = authUrl;

// After callback, complete zkLogin
const { userAddress, salt, zkProof } = 
  await completeZkLogin(jwt, ephemeralKeyPair, randomness, maxEpoch);
```

## 📊 Subscription Tiers

| Tier | Price | Monthly Volume | Products | Escrow |
|------|-------|---------------|----------|--------|
| Starter | $0 | $2,000 | 0 | ✅ |
| Professional | $500 | $200,000 | 300 | ✅ |
| Enterprise | Custom | Unlimited | Unlimited | ✅ |

## 🔍 Debugging Tips

### Smart Contract Issues
```bash
# View gas usage
sui client gas

# Check object details
sui client object <OBJECT_ID>

# View transaction
sui client tx <TX_DIGEST>

# Check events
sui client events --package <PACKAGE_ID>
```

### Frontend Issues
```bash
# Check console for errors
# Open browser DevTools > Console

# Verify environment variables
console.log(import.meta.env)

# Test IPFS connection
await testConnection()

# Check Sui connection
await suiClient.getChainIdentifier()
```

## 🌐 Important URLs

### Testnet
- RPC: `https://fullnode.testnet.sui.io:443`
- Faucet: `https://faucet.testnet.sui.io`
- Explorer: `https://testnet.suivision.xyz`

### Mainnet
- RPC: `https://fullnode.mainnet.sui.io:443`
- Explorer: `https://suivision.xyz`

### Services
- Pinata: `https://pinata.cloud`
- Google OAuth: `https://console.cloud.google.com`
- Vercel: `https://vercel.com`

## 🚨 Common Errors & Solutions

### "Insufficient gas"
```bash
# Request testnet SUI
sui client faucet

# Or buy mainnet SUI from exchange
```

### "Object not found"
```bash
# Verify object ID is correct
sui client object <OBJECT_ID>

# Check if object was consumed
sui client tx <TX_DIGEST>
```

### "zkLogin failed"
- Check OAuth redirect URI matches exactly
- Verify client ID is correct
- Ensure JWT is not expired

### "IPFS upload failed"
- Check Pinata credentials
- Verify file size < 100MB
- Test connection: `await testConnection()`

## 📱 Responsive Breakpoints

```typescript
mobile: 576px    // Phones
tablet: 768px    // Tablets
desktop: 992px   // Desktops
wide: 1200px     // Large screens
ultrawide: 1400px // Ultra-wide monitors
```

## 🎨 Color Scheme

```css
/* Currency Colors */
SUI: #4DA2FF
cNGN: #008751
BTC: #F7931A
ETH: #627EEA
SOL: #14F195
USDC: #2775CA
USDT: #26A17B
```

## 🔐 Security Checklist

Before Deployment:
- [ ] Environment variables secured
- [ ] Private keys never committed
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Logging setup
- [ ] Monitoring configured

## 📈 Gas Cost Estimates (Testnet)

| Operation | Estimated Cost |
|-----------|---------------|
| Create Account | ~0.01 SUI |
| Create Product | ~0.02 SUI |
| Create Escrow | ~0.015 SUI |
| Update Tracking | ~0.005 SUI |
| Complete Escrow | ~0.01 SUI |
| Verify Product | ~0.005 SUI |

*Mainnet costs may vary based on network congestion*

## 🎓 Learning Resources

- [Sui Docs](https://docs.sui.io)
- [Move Book](https://move-language.github.io/move/)
- [zkLogin Tutorial](https://docs.sui.io/concepts/cryptography/zklogin)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📞 Support Contacts

- **Technical**: dev@thalexa.io
- **Business**: hello@thalexa.io
- **Security**: security@thalexa.io
- **General**: support@thalexa.io

## 🏃 Quick Start (5 Minutes)

```bash
# 1. Clone and setup
cd Thalexa_V2
cd frontend && npm install

# 2. Configure
cat > .env << EOF
VITE_SUI_NETWORK=testnet
VITE_PINATA_JWT=your_jwt
VITE_GOOGLE_CLIENT_ID=your_client_id
EOF

# 3. Deploy contracts
cd ../contracts
sui move build
sui client publish --gas-budget 100000000

# 4. Update frontend config with package ID

# 5. Run
cd ../frontend
npm run dev
```

Visit `http://localhost:3000` 🚀

## 🎯 Next Actions

1. ✅ Review this guide
2. ⬜ Setup environment
3. ⬜ Deploy to testnet
4. ⬜ Test all features
5. ⬜ Get security audit
6. ⬜ Deploy to mainnet
7. ⬜ Launch! 🎉

---

**Keep this file handy for quick reference!** 📌
