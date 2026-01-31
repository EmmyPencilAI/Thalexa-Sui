# Thalexa V2 Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │   Mobile   │  │   Desktop  │  │   Tablet   │  │ Smartwatch ││
│  │    App     │  │   Browser  │  │   Browser  │  │    App     ││
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘│
│        │               │               │               │        │
│        └───────────────┴───────────────┴───────────────┘        │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │    FRONTEND (React + TS)    │
                │  • React 18 + TypeScript    │
                │  • Sui dApp Kit             │
                │  • Zustand State Management │
                │  • Bootstrap 5 UI           │
                │  • Chart.js Analytics       │
                └──────────────┬──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐    ┌────────▼────────┐    ┌──────▼──────┐
│  zkLogin Auth  │    │   IPFS Storage  │    │  API Layer  │
│  • Google      │    │   (Pinata)      │    │  • REST API │
│  • Facebook    │    │ • Product Images│    │  • WebSocket│
│  • Apple       │    │ • Metadata      │    │  • Oracle   │
└───────┬────────┘    └────────┬────────┘    └──────┬──────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │    SUI BLOCKCHAIN LAYER     │
                │                             │
                │  ┌────────────────────────┐ │
                │  │   Smart Contracts      │ │
                │  │   (Move Language)      │ │
                │  │                        │ │
                │  │ • Escrow Module        │ │
                │  │ • Multi-Currency       │ │
                │  │ • Product Registry     │ │
                │  │ • User Accounts        │ │
                │  └────────────────────────┘ │
                │                             │
                │  ┌────────────────────────┐ │
                │  │   Sui Objects          │ │
                │  │ • UserAccount          │ │
                │  │ • Product              │ │
                │  │ • EscrowContract       │ │
                │  │ • Transaction          │ │
                │  └────────────────────────┘ │
                │                             │
                └─────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │    SUI MAINNET NETWORK      │
                │  • Validators               │
                │  • Full Nodes               │
                │  • Indexers                 │
                └─────────────────────────────┘
```

## Component Breakdown

### 1. Client Layer

**Supported Devices:**
- 📱 **Mobile**: iOS & Android (React Native planned)
- 💻 **Desktop**: Chrome, Firefox, Safari, Edge
- 📟 **Tablet**: iPad, Android tablets
- ⌚ **Smartwatch**: Apple Watch, Wear OS (planned)

**Features:**
- Responsive design adapts to screen size
- Touch-optimized for mobile
- Keyboard shortcuts for desktop
- Biometric auth on mobile

### 2. Frontend Application

**Technology Stack:**
```
React 18.2
├── TypeScript 5.3
├── Vite 5.0 (build tool)
├── @mysten/dapp-kit (Sui integration)
├── @mysten/zklogin (authentication)
├── Zustand (state management)
├── React Router (routing)
├── Bootstrap 5 (UI framework)
├── Chart.js (analytics)
└── Axios (HTTP client)
```

**Directory Structure:**
```
frontend/src/
├── components/          # Reusable UI components
│   ├── common/         # Buttons, inputs, modals
│   ├── dashboard/      # Dashboard widgets
│   ├── products/       # Product management
│   ├── escrow/         # Escrow interface
│   └── auth/           # Authentication
├── pages/              # Route pages
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Escrow.tsx
│   ├── Settings.tsx
│   └── Auth.tsx
├── hooks/              # Custom React hooks
│   ├── useSui.ts       # Sui blockchain hooks
│   ├── useZkLogin.ts   # zkLogin hooks
│   └── usePinata.ts    # IPFS hooks
├── utils/              # Utility functions
│   ├── sui.ts          # Sui helpers
│   ├── zkLogin.ts      # zkLogin helpers
│   └── pinata.ts       # IPFS helpers
├── store/              # Zustand store
│   └── index.ts        # Global state
├── styles/             # CSS/SCSS files
│   ├── global.css
│   ├── components.css
│   └── responsive.css
├── config/             # Configuration
│   └── index.ts        # App config
├── types/              # TypeScript types
│   └── index.ts
└── App.tsx             # Root component
```

### 3. Authentication Layer (zkLogin)

**Flow Diagram:**
```
User
 │
 ├─→ Select Provider (Google/Facebook/Apple)
 │
 ├─→ Redirect to OAuth Provider
 │
 ├─→ Authenticate with Provider
 │
 ├─→ Receive JWT Token
 │
 ├─→ Generate Ephemeral Keypair
 │
 ├─→ Request Salt from Mysten Labs
 │
 ├─→ Generate Zero-Knowledge Proof
 │
 ├─→ Compute Sui Address
 │
 └─→ Create On-Chain Account
```

**Benefits:**
- No passwords to remember
- No private keys to manage
- Social login familiarity
- Privacy-preserving
- One-click authentication

### 4. Storage Layer (Pinata IPFS)

**Data Stored on IPFS:**

1. **Product Images**
   - Original high-res images
   - Thumbnails (auto-generated)
   - QR code images

2. **Product Metadata**
   ```json
   {
     "name": "Product Name",
     "description": "Product description",
     "category": "Electronics",
     "manufacturer": "0x...",
     "originLocation": "Lagos, Nigeria",
     "batchNumber": "BATCH-001",
     "attributes": {
       "weight": "1.5kg",
       "color": "Blue",
       "warranty": "2 years"
     },
     "certifications": ["ISO 9001", "CE"],
     "createdAt": 1706544000000
   }
   ```

3. **Verification Documents**
   - Certificates
   - Inspection reports
   - Authenticity proofs

**IPFS Flow:**
```
Frontend
 │
 ├─→ User Uploads File
 │
 ├─→ Validate File (size, type)
 │
 ├─→ Compress Image (if applicable)
 │
 ├─→ Upload to Pinata via API
 │
 ├─→ Receive IPFS Hash
 │
 ├─→ Store Hash in Smart Contract
 │
 └─→ Display via Pinata Gateway
```

### 5. Smart Contracts (Move)

**Contract Architecture:**

```
thalexa Package
├── escrow Module
│   ├── Structs
│   │   ├── PlatformConfig
│   │   ├── UserAccount
│   │   ├── Product
│   │   ├── EscrowContract
│   │   └── TrackingUpdate
│   ├── Functions
│   │   ├── create_account()
│   │   ├── upgrade_subscription()
│   │   ├── create_product()
│   │   ├── create_escrow()
│   │   ├── accept_escrow()
│   │   ├── update_tracking()
│   │   ├── complete_escrow()
│   │   ├── verify_product()
│   │   ├── dispute_escrow()
│   │   └── resolve_dispute()
│   └── Events
│       ├── ProductCreated
│       ├── EscrowCreated
│       ├── EscrowStateChanged
│       ├── ProductVerified
│       └── SubscriptionUpgraded
└── multi_currency Module
    ├── Structs
    │   ├── CNGN (currency witness)
    │   ├── CurrencyRegistry
    │   ├── ExchangeRateOracle
    │   └── MultiCurrencyWallet
    ├── Functions
    │   ├── init() - Create cNGN
    │   ├── mint_cngn()
    │   ├── burn_cngn()
    │   ├── create_wallet()
    │   ├── deposit_cngn()
    │   ├── withdraw_cngn()
    │   ├── transfer_cngn()
    │   ├── update_exchange_rate()
    │   └── convert_to_usd()
    └── Events
        ├── CurrencyExchanged
        ├── ExchangeRateUpdated
        └── cNGNMinted
```

**Object Model:**

```
UserAccount (Owned Object)
├── id: UID
├── owner: address
├── emailHash: vector<u8>
├── subscriptionTier: u8 (0=Starter, 1=Pro, 2=Enterprise)
├── subscriptionExpires: u64
├── monthlyVolume: u64
├── productsCreated: u64
├── createdAt: u64
└── isVerified: bool

Product (Shared Object)
├── id: UID
├── creator: address
├── name: String
├── description: String
├── category: String
├── metadataIpfs: String (IPFS hash)
├── imageIpfs: String (IPFS hash)
├── quantity: u64
├── unitPrice: u64
├── currency: String
├── manufacturer: address
├── originLocation: String
├── batchNumber: String
├── createdAt: u64
├── verificationCount: u64
└── isVerified: bool

EscrowContract (Shared Object)
├── id: UID
├── buyer: address
├── seller: address
├── arbiter: address
├── productId: ID
├── amount: Balance<SUI>
├── state: u8 (0-6, see states below)
├── createdAt: u64
├── acceptedAt: u64
├── completedAt: u64
├── terms: String
└── trackingUpdates: vector<TrackingUpdate>
```

**State Machine:**

```
EscrowContract States:
0: PENDING      → Escrow created, awaiting seller acceptance
1: ACCEPTED     → Seller accepted, preparing shipment
2: IN_TRANSIT   → Product shipped, in transit
3: DELIVERED    → Product delivered, awaiting buyer confirmation
4: COMPLETED    → Buyer confirmed, funds released
5: DISPUTED     → Dispute raised, arbiter notified
6: CANCELLED    → Escrow cancelled, funds returned

Transitions:
PENDING → ACCEPTED (seller accepts)
ACCEPTED → IN_TRANSIT (tracking update: "shipped")
IN_TRANSIT → DELIVERED (tracking update: "delivered")
DELIVERED → COMPLETED (buyer confirms)
ANY → DISPUTED (buyer/seller raises dispute)
DISPUTED → COMPLETED (arbiter resolves)
PENDING/ACCEPTED → CANCELLED (mutual agreement)
```

### 6. Blockchain Layer (Sui)

**Key Features:**

1. **Consensus Mechanism**
   - Narwhal & Tusk (Byzantine Fault Tolerant)
   - Sub-second finality
   - Parallel transaction execution

2. **Gas Model**
   - Pay in SUI tokens
   - Fixed gas price
   - Gas sponsored by dApp (optional)

3. **Object Model**
   - Everything is an object
   - Objects have unique IDs
   - Objects can be owned or shared

4. **Move Language**
   - Resource-oriented
   - Safe by design
   - Formally verifiable

### 7. Backend API Layer

**Endpoints:**

```
/api
├── /auth
│   ├── POST /zklogin/init
│   ├── POST /zklogin/callback
│   └── GET /zklogin/status
├── /users
│   ├── GET /:address
│   ├── PUT /:address
│   └── GET /:address/activity
├── /products
│   ├── GET /
│   ├── GET /:id
│   ├── POST /verify/:id
│   └── GET /search?q=
├── /escrows
│   ├── GET /
│   ├── GET /:id
│   └── GET /user/:address
├── /transactions
│   ├── GET /
│   ├── GET /:hash
│   └── GET /user/:address
├── /analytics
│   ├── GET /dashboard
│   ├── GET /products/stats
│   └── GET /escrows/stats
├── /oracle
│   ├── GET /rates
│   └── POST /update-rates
└── /notifications
    ├── GET /
    ├── POST /
    └── PUT /:id/read
```

## Data Flow

### Product Creation Flow

```
1. User (Pro tier) fills product form
2. Frontend validates input
3. Image compressed & uploaded to Pinata
4. Metadata JSON uploaded to Pinata
5. IPFS hashes received
6. Transaction built with Move call
7. User signs with zkLogin
8. Transaction submitted to Sui
9. Product object created on-chain
10. Event emitted (ProductCreated)
11. Frontend updates UI
12. QR code generated with product ID
```

### Escrow Payment Flow

```
1. Buyer creates escrow
   ├─→ Specifies seller, amount, product
   ├─→ Locks payment in contract
   └─→ State: PENDING

2. Seller accepts escrow
   ├─→ Reviews terms
   ├─→ Confirms acceptance
   └─→ State: ACCEPTED

3. Seller ships product
   ├─→ Updates tracking
   ├─→ Provides location updates
   └─→ State: IN_TRANSIT

4. Product delivered
   ├─→ Buyer receives product
   ├─→ Scans QR to verify
   └─→ State: DELIVERED

5. Buyer confirms receipt
   ├─→ Validates product authenticity
   ├─→ Confirms satisfaction
   ├─→ Triggers payment release
   ├─→ Platform fee deducted
   ├─→ Seller receives funds
   └─→ State: COMPLETED

Alternative: Dispute
   ├─→ Either party raises dispute
   ├─→ Arbiter reviews evidence
   ├─→ Arbiter makes decision
   └─→ Funds released accordingly
```

### Product Verification Flow

```
1. Customer scans QR code
2. QR code contains product ID
3. Frontend queries Sui blockchain
4. Retrieves Product object
5. Fetches metadata from IPFS
6. Displays product information
7. Shows verification history
8. Records verification event
9. Increments verification count
10. Updates on-chain object
```

## Security Measures

### Smart Contract Security

- ✅ No reentrancy (Move safety)
- ✅ Access control on all functions
- ✅ Input validation
- ✅ State machine validation
- ✅ Rate limiting on gas-heavy ops
- ✅ Emergency pause mechanism (planned)

### Frontend Security

- ✅ HTTPS only
- ✅ Content Security Policy
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Input sanitization
- ✅ Rate limiting

### Authentication Security

- ✅ zkLogin cryptographic proofs
- ✅ No password storage
- ✅ Email hash for privacy
- ✅ Session expiration
- ✅ Token refresh
- ✅ Device fingerprinting (planned)

### IPFS Security

- ✅ Content addressing (tamper-proof)
- ✅ Encrypted metadata (optional)
- ✅ Access control via contract
- ✅ File size validation
- ✅ File type validation

## Performance Optimizations

### Frontend

- ⚡ Code splitting
- ⚡ Lazy loading
- ⚡ Image optimization
- ⚡ Caching strategy
- ⚡ Service worker (PWA)
- ⚡ Virtual scrolling

### Blockchain

- ⚡ Transaction batching
- ⚡ Gas optimization
- ⚡ Object pooling
- ⚡ Event indexing
- ⚡ Parallel execution

### IPFS

- ⚡ CDN distribution
- ⚡ Image compression
- ⚡ Lazy loading
- ⚡ Caching headers
- ⚡ Progressive loading

## Scalability

### Current Capacity

- **Users**: 100,000+
- **Products**: 1,000,000+
- **Transactions**: 10,000/day
- **Storage**: Unlimited (IPFS)

### Future Scaling

- **Users**: 10,000,000+
- **Products**: 100,000,000+
- **Transactions**: 1,000,000/day
- **Global CDN**: Multi-region

## Monitoring & Analytics

### Metrics Tracked

1. **User Metrics**
   - Active users (DAU/MAU)
   - New signups
   - Retention rate
   - Subscription upgrades

2. **Transaction Metrics**
   - Transaction volume
   - Transaction value
   - Success rate
   - Average gas cost

3. **Product Metrics**
   - Products created
   - Products verified
   - Verification rate
   - Popular categories

4. **Escrow Metrics**
   - Escrows created
   - Completion rate
   - Dispute rate
   - Average amount

5. **System Metrics**
   - Response time
   - Error rate
   - Uptime
   - Gas consumption

### Monitoring Tools

- **Frontend**: Vercel Analytics
- **Blockchain**: Sui Explorer
- **IPFS**: Pinata Dashboard
- **API**: Custom dashboard

## Disaster Recovery

### Backup Strategy

1. **Blockchain Data**
   - Immutable on Sui mainnet
   - No backup needed
   - Historical data via indexers

2. **IPFS Data**
   - Pinned on Pinata
   - Replicated across nodes
   - Backup to S3 (optional)

3. **User Preferences**
   - Database backups (daily)
   - Point-in-time recovery
   - Multi-region replication

### Recovery Plan

1. **Frontend Down**
   - Failover to backup hosting
   - ETA: < 5 minutes

2. **API Down**
   - Auto-scaling kicks in
   - Fallback to cached data
   - ETA: < 2 minutes

3. **IPFS Down**
   - Failover to backup gateway
   - Local cache serves content
   - ETA: < 1 minute

4. **Blockchain Issues**
   - Wait for network recovery
   - Queue transactions
   - Notify users

## Technology Choices Rationale

### Why Sui?

- ✅ Fast finality (< 1 second)
- ✅ Low gas fees
- ✅ Object-centric model
- ✅ Move language safety
- ✅ Parallel execution
- ✅ Developer-friendly

### Why zkLogin?

- ✅ Better UX (no passwords)
- ✅ Higher security
- ✅ Privacy-preserving
- ✅ Familiar social login
- ✅ Sui-native integration

### Why Pinata?

- ✅ Reliable IPFS service
- ✅ Good pricing
- ✅ Easy API
- ✅ Fast CDN
- ✅ No infrastructure management

### Why React?

- ✅ Large ecosystem
- ✅ Component reusability
- ✅ Virtual DOM performance
- ✅ TypeScript support
- ✅ Mobile-friendly

## Future Enhancements

### Short Term (Q1-Q2 2026)

- [ ] Mobile apps
- [ ] Bulk product upload
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Payment gateway integration

### Medium Term (Q3-Q4 2026)

- [ ] AI fraud detection
- [ ] Custom smart contracts
- [ ] White-label solutions
- [ ] Cross-chain bridges
- [ ] Insurance integration

### Long Term (2027+)

- [ ] IoT integration
- [ ] AR verification
- [ ] Supply chain automation
- [ ] Carbon tracking
- [ ] Global compliance tools

---

This architecture is designed for:
- **Scalability**: Handle millions of users
- **Security**: Multi-layer protection
- **Performance**: Sub-second response times
- **Reliability**: 99.9% uptime
- **Usability**: Intuitive UX across devices
