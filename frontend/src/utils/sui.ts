import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import config from '../config';

// Initialize Sui client
export const suiClient = new SuiClient({
  url: config.network.sui.fullnode,
});

// Transaction Builder Class
export class SuiTransactionBuilder {
  private txb: TransactionBlock;

  constructor() {
    this.txb = new TransactionBlock();
  }

  // Create user account with zkLogin
  createAccount(emailHash: string) {
    const packageId = config.contracts.packageId;
    
    this.txb.moveCall({
      target: `${packageId}::escrow::create_account`,
      arguments: [
        this.txb.pure(Array.from(Buffer.from(emailHash, 'hex'))),
      ],
    });

    return this;
  }

  // Upgrade subscription
  upgradeSubscription(
    accountId: string,
    tier: number,
    paymentAmount: number,
    clockId: string = '0x6'
  ) {
    const packageId = config.contracts.packageId;
    
    const [coin] = this.txb.splitCoins(this.txb.gas, [
      this.txb.pure(paymentAmount),
    ]);

    this.txb.moveCall({
      target: `${packageId}::escrow::upgrade_subscription`,
      arguments: [
        this.txb.object(accountId),
        coin,
        this.txb.pure(tier),
        this.txb.object(clockId),
      ],
    });

    return this;
  }

  // Create product
  createProduct(
    accountId: string,
    productData: {
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
    },
    clockId: string = '0x6'
  ) {
    const packageId = config.contracts.packageId;

    this.txb.moveCall({
      target: `${packageId}::escrow::create_product`,
      arguments: [
        this.txb.object(accountId),
        this.txb.pure(Array.from(Buffer.from(productData.name, 'utf-8'))),
        this.txb.pure(Array.from(Buffer.from(productData.description, 'utf-8'))),
        this.txb.pure(Array.from(Buffer.from(productData.category, 'utf-8'))),
        this.txb.pure(Array.from(Buffer.from(productData.metadataIpfs, 'utf-8'))),
        this.txb.pure(Array.from(Buffer.from(productData.imageIpfs, 'utf-8'))),
        this.txb.pure(productData.quantity),
        this.txb.pure(productData.unitPrice),
        this.txb.pure(Array.from(Buffer.from(productData.currency, 'utf-8'))),
        this.txb.pure(productData.manufacturer),
        this.txb.pure(Array.from(Buffer.from(productData.originLocation, 'utf-8'))),
        this.txb.pure(Array.from(Buffer.from(productData.batchNumber, 'utf-8'))),
        this.txb.object(clockId),
      ],
    });

    return this;
  }

  // Create escrow
  createEscrow(
    seller: string,
    arbiter: string,
    productId: string,
    amount: number,
    terms: string,
    configId: string,
    clockId: string = '0x6'
  ) {
    const packageId = config.contracts.packageId;

    const [coin] = this.txb.splitCoins(this.txb.gas, [this.txb.pure(amount)]);

    this.txb.moveCall({
      target: `${packageId}::escrow::create_escrow`,
      arguments: [
        this.txb.pure(seller),
        this.txb.pure(arbiter),
        this.txb.pure(productId),
        coin,
        this.txb.pure(Array.from(Buffer.from(terms, 'utf-8'))),
        this.txb.object(configId),
        this.txb.object(clockId),
      ],
    });

    return this;
  }

  // Accept escrow
  acceptEscrow(escrowId: string, clockId: string = '0x6') {
    const packageId = config.contracts.packageId;

    this.txb.moveCall({
      target: `${packageId}::escrow::accept_escrow`,
      arguments: [
        this.txb.object(escrowId),
        this.txb.object(clockId),
      ],
    });

    return this;
  }

  // Update tracking
  updateTracking(
    escrowId: string,
    location: string,
    status: string,
    clockId: string = '0x6'
  ) {
    const packageId = config.contracts.packageId;

    this.txb.moveCall({
      target: `${packageId}::escrow::update_tracking`,
      arguments: [
        this.txb.object(escrowId),
        this.txb.pure(Array.from(Buffer.from(location, 'utf-8'))),
        this.txb.pure(Array.from(Buffer.from(status, 'utf-8'))),
        this.txb.object(clockId),
      ],
    });

    return this;
  }

  // Complete escrow
  completeEscrow(
    escrowId: string,
    configId: string,
    clockId: string = '0x6'
  ) {
    const packageId = config.contracts.packageId;

    this.txb.moveCall({
      target: `${packageId}::escrow::complete_escrow`,
      arguments: [
        this.txb.object(escrowId),
        this.txb.object(configId),
        this.txb.object(clockId),
      ],
    });

    return this;
  }

  // Verify product
  verifyProduct(productId: string, clockId: string = '0x6') {
    const packageId = config.contracts.packageId;

    this.txb.moveCall({
      target: `${packageId}::escrow::verify_product`,
      arguments: [
        this.txb.object(productId),
        this.txb.object(clockId),
      ],
    });

    return this;
  }

  // Dispute escrow
  disputeEscrow(escrowId: string, clockId: string = '0x6') {
    const packageId = config.contracts.packageId;

    this.txb.moveCall({
      target: `${packageId}::escrow::dispute_escrow`,
      arguments: [
        this.txb.object(escrowId),
        this.txb.object(clockId),
      ],
    });

    return this;
  }

  // Build and return transaction block
  build() {
    return this.txb;
  }
}

// Execute transaction
export async function executeTransaction(
  txb: TransactionBlock,
  signer: any
): Promise<SuiTransactionBlockResponse> {
  try {
    const result = await suiClient.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      signer,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Transaction execution failed:', error);
    throw error;
  }
}

// Get account balance
export async function getBalance(address: string): Promise<number> {
  try {
    const balance = await suiClient.getBalance({
      owner: address,
    });
    return Number(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI
  } catch (error) {
    console.error('Failed to get balance:', error);
    return 0;
  }
}

// Get owned objects
export async function getOwnedObjects(address: string, objectType?: string) {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      filter: objectType ? { StructType: objectType } : undefined,
      options: {
        showContent: true,
        showType: true,
        showDisplay: true,
      },
    });

    return objects.data;
  } catch (error) {
    console.error('Failed to get owned objects:', error);
    return [];
  }
}

// Get user account
export async function getUserAccount(address: string) {
  try {
    const packageId = config.contracts.packageId;
    const objects = await getOwnedObjects(
      address,
      `${packageId}::escrow::UserAccount`
    );

    if (objects.length > 0) {
      return objects[0];
    }
    return null;
  } catch (error) {
    console.error('Failed to get user account:', error);
    return null;
  }
}

// Get user products
export async function getUserProducts(address: string) {
  try {
    const packageId = config.contracts.packageId;
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      filter: { StructType: `${packageId}::escrow::Product` },
      options: {
        showContent: true,
        showType: true,
      },
    });

    return objects.data.map((obj: any) => obj.data?.content?.fields || {});
  } catch (error) {
    console.error('Failed to get user products:', error);
    return [];
  }
}

// Get escrow contracts
export async function getEscrowContracts(address: string) {
  try {
    const packageId = config.contracts.packageId;
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      filter: { StructType: `${packageId}::escrow::EscrowContract` },
      options: {
        showContent: true,
        showType: true,
      },
    });

    return objects.data.map((obj: any) => obj.data?.content?.fields || {});
  } catch (error) {
    console.error('Failed to get escrow contracts:', error);
    return [];
  }
}

// Get object by ID
export async function getObjectById(objectId: string) {
  try {
    const object = await suiClient.getObject({
      id: objectId,
      options: {
        showContent: true,
        showType: true,
        showDisplay: true,
      },
    });

    return object;
  } catch (error) {
    console.error('Failed to get object:', error);
    return null;
  }
}

// Query events
export async function queryEvents(
  packageId: string,
  eventType: string,
  limit: number = 50
) {
  try {
    const events = await suiClient.queryEvents({
      query: { MoveEventType: `${packageId}::escrow::${eventType}` },
      limit,
      order: 'descending',
    });

    return events.data;
  } catch (error) {
    console.error('Failed to query events:', error);
    return [];
  }
}

// Request gas from faucet (testnet/devnet only)
export async function requestGas(address: string): Promise<boolean> {
  try {
    if (config.network.sui.network === 'mainnet') {
      console.warn('Faucet not available on mainnet');
      return false;
    }

    const response = await fetch(config.network.sui.faucet, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FixedAmountRequest: {
          recipient: address,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to request gas:', error);
    return false;
  }
}

// Convert MIST to SUI
export function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}

// Convert SUI to MIST
export function suiToMist(sui: number): number {
  return Math.floor(sui * 1_000_000_000);
}

// Format address
export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Validate Sui address
export function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export default {
  SuiTransactionBuilder,
  executeTransaction,
  getBalance,
  getOwnedObjects,
  getUserAccount,
  getUserProducts,
  getEscrowContracts,
  getObjectById,
  queryEvents,
  requestGas,
  mistToSui,
  suiToMist,
  formatAddress,
  isValidSuiAddress,
};
