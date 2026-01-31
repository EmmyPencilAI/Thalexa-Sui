# Thalexa V2 Deployment Guide

This guide walks you through deploying Thalexa from Arc testnet to Sui mainnet with all features enabled.

## Prerequisites Checklist

- [ ] Sui CLI installed
- [ ] Sui wallet with mainnet SUI for gas fees
- [ ] Node.js 18+ installed
- [ ] Pinata account with API credentials
- [ ] Google OAuth credentials (for zkLogin)
- [ ] Domain name (for production)
- [ ] Vercel account (for hosting)

## Step 1: Prepare Sui Wallet

### Install Sui CLI

```bash
# Install Rust if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

### Create/Import Wallet

```bash
# Create new wallet
sui client new-address ed25519

# Or import existing wallet
sui client import <private_key> ed25519

# Set active address
sui client switch --address <your_address>

# Switch to mainnet
sui client switch --env mainnet

# Check balance (you need SUI for gas)
sui client gas
```

### Get Mainnet SUI

You'll need SUI tokens for:
- Contract deployment: ~1 SUI
- Initial transactions: ~0.1 SUI
- Testing: ~0.5 SUI

Purchase SUI from exchanges like:
- Binance
- OKX
- Kraken
- KuCoin

## Step 2: Configure Pinata IPFS

### Create Pinata Account

1. Go to https://pinata.cloud
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key with:
   - Admin permissions
   - Name: "Thalexa Production"

### Save Credentials

```bash
# You'll need these values:
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key
PINATA_JWT=your_jwt_token
```

## Step 3: Setup Google OAuth (zkLogin)

### Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create new project "Thalexa"
3. Enable Google+ API
4. Go to "Credentials"
5. Create OAuth 2.0 Client ID
6. Set authorized redirect URIs:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for testing)

### Save Credentials

```bash
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

## Step 4: Deploy Smart Contracts

### 1. Build Contracts

```bash
cd Thalexa_V2/contracts

# Build and check for errors
sui move build

# Run tests
sui move test
```

### 2. Deploy to Mainnet

```bash
# Deploy with sufficient gas budget
sui client publish --gas-budget 100000000

# Sample output:
# Package published successfully
# Package ID: 0x1234567890abcdef...
# Transaction Digest: ABC123XYZ...
```

### 3. Save Contract Addresses

After deployment, save these values:

```bash
PACKAGE_ID=0x1234567890abcdef...
ESCROW_CONTRACT=0x... # Found in deployment output
MULTI_CURRENCY_CONTRACT=0x...
PLATFORM_CONFIG=0x...
```

### 4. Initialize Contracts

```bash
# The contracts auto-initialize on deployment
# Verify initialization:
sui client object <PLATFORM_CONFIG_ID>
```

## Step 5: Configure Frontend

### 1. Clone and Setup

```bash
cd Thalexa_V2/frontend
npm install
```

### 2. Create Environment File

Create `.env` file:

```env
# Network Configuration
VITE_SUI_NETWORK=mainnet
VITE_SUI_RPC=https://fullnode.mainnet.sui.io:443

# Smart Contracts (from Step 4)
VITE_PACKAGE_ID=0x1234567890abcdef...
VITE_ESCROW_CONTRACT=0x...
VITE_MULTI_CURRENCY_CONTRACT=0x...

# zkLogin (from Step 3)
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_FACEBOOK_CLIENT_ID=your_facebook_client_id
VITE_APPLE_CLIENT_ID=your_apple_client_id
VITE_ZKLOGIN_REDIRECT_URL=https://yourdomain.com/auth/callback

# Pinata IPFS (from Step 2)
VITE_PINATA_API_KEY=your_api_key
VITE_PINATA_SECRET_KEY=your_secret_key
VITE_PINATA_JWT=your_jwt
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Backend API
VITE_BACKEND_URL=https://thalexa-api.vercel.app

# App Configuration
VITE_APP_NAME=Thalexa
VITE_APP_URL=https://yourdomain.com
```

### 3. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and test:
- [ ] zkLogin authentication
- [ ] Balance display
- [ ] Product creation (if subscribed)
- [ ] Escrow creation
- [ ] QR code generation

## Step 6: Deploy Frontend to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

### 4. Configure Domain

1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" > "Domains"
4. Add your custom domain
5. Update DNS records as instructed

### 5. Add Environment Variables

In Vercel dashboard:
1. Go to "Settings" > "Environment Variables"
2. Add all variables from `.env`
3. Redeploy: `vercel --prod`

## Step 7: Deploy Backend API

### 1. Setup Backend

```bash
cd Thalexa_V2/backend
npm install
```

### 2. Create `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

### 3. Deploy

```bash
vercel --prod
```

### 4. Update Frontend

Update `VITE_BACKEND_URL` in frontend with your backend URL.

## Step 8: Configure cNGN (Nigerian Naira Coin)

### 1. Initialize cNGN Treasury

```bash
# Call the multi_currency contract initialization
sui client call \
  --package <MULTI_CURRENCY_PACKAGE_ID> \
  --module multi_currency \
  --function init \
  --gas-budget 10000000
```

### 2. Setup Exchange Rate Oracle

Update exchange rates for cNGN:

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module multi_currency \
  --function update_exchange_rate \
  --args <ORACLE_ID> "cNGN" 16 \
  --gas-budget 10000000
```

Rate: 16 basis points = 0.0016 USD (≈625 NGN per USD)

## Step 9: Testing in Production

### Test Checklist

1. **Authentication**
   - [ ] Google zkLogin works
   - [ ] Wallet created automatically
   - [ ] Balance displays correctly

2. **Transactions**
   - [ ] Send SUI works
   - [ ] Send cNGN works (if funded)
   - [ ] Transaction history updates

3. **Products (Professional tier)**
   - [ ] Can create product
   - [ ] Image uploads to IPFS
   - [ ] QR code generates
   - [ ] Product verifiable

4. **Escrow**
   - [ ] Can create escrow
   - [ ] Seller can accept
   - [ ] Tracking updates work
   - [ ] Buyer can complete
   - [ ] Funds release correctly

5. **Subscription**
   - [ ] Can upgrade to Professional
   - [ ] Usage limits enforced
   - [ ] Subscription expires correctly

## Step 10: Monitor and Maintain

### Setup Monitoring

1. **Vercel Analytics**
   - Enable in dashboard
   - Monitor page loads
   - Track errors

2. **Sui Explorer**
   - Monitor contract calls
   - Track gas usage
   - Watch for errors

3. **Pinata Dashboard**
   - Monitor storage usage
   - Track bandwidth
   - Check pin status

### Regular Maintenance

- **Daily**: Check error logs
- **Weekly**: Review gas costs
- **Monthly**: Audit user feedback
- **Quarterly**: Security audit

## Troubleshooting

### Contract Deployment Fails

```bash
# Increase gas budget
sui client publish --gas-budget 200000000

# Or split into smaller packages
```

### zkLogin Not Working

1. Check OAuth redirect URI matches exactly
2. Verify client ID is correct
3. Check browser console for errors

### IPFS Upload Fails

1. Verify Pinata credentials
2. Check file size < 100MB
3. Test connection: `curl -X GET https://api.pinata.cloud/data/testAuthentication`

### Transaction Fails

1. Check gas balance
2. Verify object IDs are correct
3. Check contract is published
4. Review transaction in Sui Explorer

## Post-Deployment

### Announce Launch

1. Update README with live URLs
2. Post on social media
3. Email beta users
4. Submit to dApp directories

### Collect Feedback

1. Setup user feedback form
2. Monitor support channels
3. Track usage metrics
4. Plan improvements

## Next Steps

- [ ] Create mobile apps
- [ ] Add more currencies
- [ ] Implement advanced analytics
- [ ] Setup customer support
- [ ] Marketing campaign

## Support

If you encounter issues:

1. Check [FAQ](https://docs.thalexa.io/faq)
2. Join [Discord](https://discord.gg/thalexa)
3. Email: support@thalexa.io

## Security Checklist

- [ ] Private keys stored securely
- [ ] Environment variables not committed
- [ ] HTTPS enabled on all endpoints
- [ ] Rate limiting configured
- [ ] Regular security audits scheduled
- [ ] Backup plan in place

---

**Congratulations!** 🎉

Your Thalexa platform is now live on Sui mainnet!

Monitor the platform closely for the first few weeks and be ready to respond to user feedback.

Good luck! 🚀
