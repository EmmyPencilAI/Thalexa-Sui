# Migration Guide: Arc Testnet → Sui Mainnet

This guide helps you migrate your existing Thalexa application from Arc testnet to Sui mainnet with all new features.

## Overview of Changes

### What's New in V2

1. **Blockchain Migration**
   - From: Arc testnet (EVM-compatible)
   - To: Sui mainnet (Move-based)
   - Benefits: Lower fees, faster finality, better scalability

2. **New Features**
   - zkLogin for passwordless authentication
   - Multi-currency support (added cNGN)
   - Enhanced escrow system
   - Product verification via QR
   - IPFS integration via Pinata
   - Subscription tiers
   - Cross-device responsive design

3. **Architecture Changes**
   - Smart contracts rewritten in Move
   - Frontend rebuilt with React + TypeScript
   - Zustand for state management
   - Sui dApp Kit integration

## Pre-Migration Checklist

- [ ] Backup all Arc testnet data
- [ ] Export user list and balances
- [ ] Download all product metadata
- [ ] Save all transaction records
- [ ] Inform users about migration
- [ ] Prepare migration timeline

## Migration Steps

### Phase 1: Data Preparation (Day 1-3)

#### 1. Export Existing Data

```bash
# Export users
node scripts/export-users.js > users.json

# Export products
node scripts/export-products.js > products.json

# Export transactions
node scripts/export-transactions.js > transactions.json
```

#### 2. Backup IPFS Data

If using Pinata:
```bash
# List all pins
curl -X GET "https://api.pinata.cloud/data/pinList" \
  -H "pinata_api_key: YOUR_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET" \
  > pinned-files.json

# Download metadata for each pin
# (Use script to automate)
```

#### 3. Analyze Data for Migration

```javascript
// analyze-data.js
const users = require('./users.json');
const products = require('./products.json');

console.log(`Total users: ${users.length}`);
console.log(`Total products: ${products.length}`);
console.log(`Active subscriptions: ${users.filter(u => u.isPro).length}`);
```

### Phase 2: Setup Sui Infrastructure (Day 4-7)

#### 1. Deploy Smart Contracts

Follow deployment guide in `DEPLOYMENT.md`:

```bash
cd Thalexa_V2/contracts
sui move build
sui client publish --gas-budget 100000000
```

Save package IDs for migration scripts.

#### 2. Setup Migration Environment

```bash
# Create migration directory
mkdir migration
cd migration

# Install dependencies
npm init -y
npm install @mysten/sui.js axios dotenv

# Create .env
cat > .env << EOF
SUI_PRIVATE_KEY=your_private_key
PACKAGE_ID=deployed_package_id
ARC_RPC_URL=https://arc-testnet-rpc.example.com
SUI_RPC_URL=https://fullnode.mainnet.sui.io
PINATA_JWT=your_jwt
EOF
```

#### 3. Create Migration Scripts

**migrate-users.js**:
```javascript
const { SuiClient } = require('@mysten/sui.js/client');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const fs = require('fs');

async function migrateUsers() {
  const users = JSON.parse(fs.readFileSync('users.json'));
  const sui = new SuiClient({ url: process.env.SUI_RPC_URL });
  const keypair = Ed25519Keypair.fromSecretKey(process.env.SUI_PRIVATE_KEY);

  for (const user of users) {
    console.log(`Migrating user: ${user.address}`);
    
    // Create Sui account for user
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${process.env.PACKAGE_ID}::escrow::create_account`,
      arguments: [
        tx.pure(Array.from(Buffer.from(user.emailHash, 'hex'))),
      ],
    });

    try {
      const result = await sui.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: keypair,
      });
      console.log(`✓ User migrated: ${result.digest}`);
      
      // Save mapping
      fs.appendFileSync(
        'user-mappings.csv',
        `${user.address},${result.objectChanges[0].objectId}\n`
      );
    } catch (error) {
      console.error(`✗ Failed: ${user.address}`, error);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

migrateUsers();
```

**migrate-products.js**:
```javascript
// Similar structure for products
// Include IPFS hash migration
// Map old product IDs to new Sui object IDs
```

### Phase 3: User Communication (Day 8-10)

#### 1. Announce Migration

**Email Template**:

```
Subject: Important: Thalexa Platform Migration to Sui Mainnet

Dear Thalexa User,

We're excited to announce that Thalexa is migrating to Sui mainnet!

What this means for you:
• Faster transactions
• Lower fees
• Enhanced security
• New features (zkLogin, multi-currency, etc.)

Migration Timeline:
• [Date]: Platform read-only mode
• [Date]: Migration begins
• [Date]: New platform goes live

Action Required:
1. Login to your account before [date]
2. Review your data
3. No password needed - use zkLogin!

Your existing data will be migrated automatically.

Questions? Visit https://docs.thalexa.io/migration

Best regards,
The Thalexa Team
```

#### 2. Create Migration Landing Page

```html
<!-- migration-notice.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Thalexa Migration Notice</title>
</head>
<body>
  <div class="notice">
    <h1>🚀 We're Moving to Sui!</h1>
    <p>Thalexa is upgrading to Sui mainnet for better performance.</p>
    
    <div class="timeline">
      <h2>Migration Timeline</h2>
      <ul>
        <li><strong>Feb 1:</strong> Announcement</li>
        <li><strong>Feb 15:</strong> Read-only mode</li>
        <li><strong>Feb 16-17:</strong> Migration</li>
        <li><strong>Feb 18:</strong> New platform live!</li>
      </ul>
    </div>
    
    <div class="benefits">
      <h2>What's New?</h2>
      <ul>
        <li>✅ zkLogin - No passwords needed</li>
        <li>✅ Nigerian Naira (cNGN) support</li>
        <li>✅ Enhanced escrow system</li>
        <li>✅ Mobile & smartwatch support</li>
        <li>✅ Advanced analytics</li>
      </ul>
    </div>
    
    <a href="/docs/migration" class="cta">Learn More</a>
  </div>
</body>
</html>
```

### Phase 4: Execute Migration (Day 11-12)

#### 1. Enable Read-Only Mode

```javascript
// In your Arc app
const MIGRATION_MODE = true;

if (MIGRATION_MODE) {
  // Disable writes
  // Show migration notice
  // Allow reads only
}
```

#### 2. Run Migration Scripts

```bash
# Migrate users first
node migration/migrate-users.js

# Verify user migration
node migration/verify-users.js

# Migrate products
node migration/migrate-products.js

# Verify products
node migration/verify-products.js

# Migrate active escrows
node migration/migrate-escrows.js
```

#### 3. Verify Data Integrity

```javascript
// verify-migration.js
async function verify() {
  const arcUsers = JSON.parse(fs.readFileSync('users.json'));
  const mappings = parseMappings('user-mappings.csv');
  
  let success = 0;
  let failed = 0;
  
  for (const user of arcUsers) {
    const suiObjectId = mappings[user.address];
    if (!suiObjectId) {
      console.error(`Missing mapping for ${user.address}`);
      failed++;
      continue;
    }
    
    const suiObject = await sui.getObject({
      id: suiObjectId,
      options: { showContent: true },
    });
    
    if (suiObject.data) {
      success++;
    } else {
      failed++;
      console.error(`Missing object for ${user.address}`);
    }
  }
  
  console.log(`\nMigration Results:`);
  console.log(`✓ Success: ${success}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Success Rate: ${(success/(success+failed)*100).toFixed(2)}%`);
}
```

### Phase 5: Launch New Platform (Day 13-14)

#### 1. Deploy Frontend

```bash
cd Thalexa_V2/frontend
npm run build
vercel --prod
```

#### 2. Update DNS

```bash
# Point thalexa.io to new Vercel deployment
# Keep arc-testnet.thalexa.io for reference
```

#### 3. Enable New Platform

```javascript
// Remove maintenance mode
const MIGRATION_COMPLETE = true;

// Redirect old URLs to new platform
if (window.location.host === 'old.thalexa.io') {
  window.location.href = 'https://app.thalexa.io';
}
```

#### 4. Monitor Launch

```bash
# Watch Vercel logs
vercel logs --follow

# Monitor Sui transactions
# Check error rates
# Track user signups
```

### Phase 6: Post-Migration (Day 15-30)

#### 1. User Support

Setup dedicated support channels:
- Migration FAQ page
- Live chat support
- Email: migration@thalexa.io
- Discord channel: #migration-help

#### 2. Data Validation

Run daily validation scripts:

```bash
# Check for missing data
node scripts/validate-migration.js

# Compare Arc vs Sui data
node scripts/compare-data.js
```

#### 3. Performance Monitoring

```javascript
// Track key metrics
const metrics = {
  migrationSuccess: 0.98, // 98% success rate
  avgResponseTime: 250,    // ms
  errorRate: 0.02,         // 2%
  userSatisfaction: 4.5,   // out of 5
};
```

## Data Mapping

### User Accounts

| Arc Field | Sui Field | Transformation |
|-----------|-----------|----------------|
| address | owner | Direct |
| email | emailHash | Hash with SHA256 |
| isPro | subscriptionTier | 0=Free, 1=Pro, 2=Enterprise |
| balance | Not migrated | Users must deposit |

### Products

| Arc Field | Sui Field | Transformation |
|-----------|-----------|----------------|
| id | id | New Sui object ID |
| name | name | Direct |
| ipfsHash | metadataIpfs | Direct |
| imageUrl | imageIpfs | Re-upload to IPFS |

### Escrows

| Arc Field | Sui Field | Transformation |
|-----------|-----------|----------------|
| id | id | New Sui object ID |
| buyer | buyer | Map to Sui address |
| seller | seller | Map to Sui address |
| amount | amount | Convert to MIST |
| status | state | Map status codes |

## Rollback Plan

If migration fails:

1. **Keep Arc testnet running** in parallel
2. **Document failures** for each user
3. **Restore from backup** if needed
4. **Notify affected users** immediately
5. **Extend migration window**

### Rollback Script

```bash
#!/bin/bash

echo "Rolling back migration..."

# Restore Arc database
mongorestore --db thalexa_arc backup/arc-backup-[date]

# Re-enable Arc frontend
heroku scale web=1 -a thalexa-arc

# Update DNS to point back
# Notify users

echo "Rollback complete"
```

## Common Issues & Solutions

### Issue 1: Gas Fees Too High

**Solution**: Batch transactions, optimize contract calls

```javascript
// Bad - Multiple calls
for (const user of users) {
  await createAccount(user);
}

// Good - Batch processing
await batchCreateAccounts(users.slice(0, 100));
```

### Issue 2: IPFS Upload Failures

**Solution**: Retry with exponential backoff

```javascript
async function uploadWithRetry(file, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await pinata.uploadFile(file);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

### Issue 3: Rate Limiting

**Solution**: Implement rate limiting and queuing

```javascript
const RateLimiter = require('rate-limiter');
const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 'second' });

async function migrateWithRateLimit(item) {
  await limiter.removeTokens(1);
  return migrate(item);
}
```

## Testing Checklist

Before production migration:

- [ ] Test migration on testnet
- [ ] Verify all user data migrates
- [ ] Check all products are accessible
- [ ] Test escrow functionality
- [ ] Validate zkLogin works
- [ ] Confirm IPFS uploads
- [ ] Test subscription upgrades
- [ ] Verify transaction history
- [ ] Check QR code generation
- [ ] Test on mobile devices

## Success Criteria

Migration is successful when:

- ✅ >95% user accounts migrated
- ✅ >99% product data migrated
- ✅ All active escrows transferred
- ✅ <5% user complaints
- ✅ Platform response time <500ms
- ✅ Zero critical bugs
- ✅ All integrations working

## Timeline Summary

| Phase | Duration | Tasks |
|-------|----------|-------|
| Preparation | 3 days | Export data, setup scripts |
| Infrastructure | 4 days | Deploy contracts, configure |
| Communication | 3 days | Notify users, prepare docs |
| Migration | 2 days | Execute scripts, verify data |
| Launch | 2 days | Deploy frontend, go live |
| Post-migration | 15 days | Support, monitoring, fixes |

**Total**: ~30 days for complete migration

## Budget Estimate

- Sui gas fees: ~10 SUI ($40-50)
- IPFS storage: $20/month
- Vercel hosting: $20/month
- Development time: 80 hours
- Testing time: 40 hours
- Support time: 60 hours

**Total estimated cost**: ~$500-1000 (plus labor)

## Resources

- [Sui Documentation](https://docs.sui.io)
- [Move Language Guide](https://move-language.github.io/move/)
- [zkLogin Tutorial](https://docs.sui.io/concepts/cryptography/zklogin)
- [Pinata Docs](https://docs.pinata.cloud)

## Support

For migration assistance:
- **Email**: migration@thalexa.io
- **Discord**: #migration-support
- **Office Hours**: Daily 10am-6pm UTC

---

**Good luck with your migration!** 🚀

The Thalexa team is here to help every step of the way.
