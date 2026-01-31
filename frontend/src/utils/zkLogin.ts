import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { generateNonce, generateRandomness } from '@mysten/zklogin';
import { jwtDecode } from 'jwt-decode';
import config from '../config';

export interface ZkLoginState {
  nonce: string;
  randomness: string;
  maxEpoch: number;
  provider: 'google' | 'facebook' | 'apple';
  jwt: string | null;
  salt: string | null;
  userAddress: string | null;
  ephemeralKeyPair: Ed25519Keypair | null;
}

// Generate ephemeral keypair
export function generateEphemeralKeyPair(): Ed25519Keypair {
  return new Ed25519Keypair();
}

// Generate nonce for zkLogin
export function generateZkLoginNonce(
  ephemeralPublicKey: string,
  maxEpoch: number,
  randomness: string
): string {
  return generateNonce(ephemeralPublicKey, maxEpoch, randomness);
}

// Initialize zkLogin flow
export async function initializeZkLogin(
  provider: 'google' | 'facebook' | 'apple',
  maxEpoch: number
): Promise<{
  authUrl: string;
  ephemeralKeyPair: Ed25519Keypair;
  nonce: string;
  randomness: string;
}> {
  // Generate ephemeral keypair
  const ephemeralKeyPair = generateEphemeralKeyPair();
  const ephemeralPublicKey = ephemeralKeyPair.getPublicKey().toSuiAddress();

  // Generate randomness
  const randomness = generateRandomness();

  // Generate nonce
  const nonce = generateZkLoginNonce(ephemeralPublicKey, maxEpoch, randomness);

  // Build auth URL based on provider
  let authUrl = '';
  const redirectUri = encodeURIComponent(config.zkLogin.redirectUrl);
  const state = encodeURIComponent(
    JSON.stringify({
      provider,
      randomness,
      maxEpoch,
      ephemeralPublicKey,
    })
  );

  switch (provider) {
    case 'google':
      authUrl = `${config.zkLogin.providers.google.authUrl}?` +
        `client_id=${config.zkLogin.providers.google.clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=id_token&` +
        `scope=openid email&` +
        `nonce=${nonce}&` +
        `state=${state}`;
      break;

    case 'facebook':
      authUrl = `${config.zkLogin.providers.facebook.authUrl}?` +
        `client_id=${config.zkLogin.providers.facebook.clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=token&` +
        `scope=email&` +
        `nonce=${nonce}&` +
        `state=${state}`;
      break;

    case 'apple':
      authUrl = `${config.zkLogin.providers.apple.authUrl}?` +
        `client_id=${config.zkLogin.providers.apple.clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=id_token&` +
        `scope=email&` +
        `nonce=${nonce}&` +
        `state=${state}`;
      break;
  }

  return {
    authUrl,
    ephemeralKeyPair,
    nonce,
    randomness,
  };
}

// Parse JWT and extract user info
export function parseJWT(jwt: string): {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
  exp: number;
} {
  try {
    const decoded: any = jwtDecode(jwt);
    return {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      iss: decoded.iss,
      aud: decoded.aud,
      exp: decoded.exp,
    };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    throw new Error('Invalid JWT');
  }
}

// Get salt from Mysten Labs salt server
export async function getSalt(jwt: string): Promise<string> {
  try {
    const response = await fetch(config.zkLogin.saltServer, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jwt }),
    });

    if (!response.ok) {
      throw new Error('Failed to get salt');
    }

    const data = await response.json();
    return data.salt;
  } catch (error) {
    console.error('Failed to get salt:', error);
    throw error;
  }
}

// Get zero-knowledge proof from proof server
export async function getZkProof(
  jwt: string,
  salt: string,
  randomness: string,
  maxEpoch: number
): Promise<any> {
  try {
    const response = await fetch(config.zkLogin.proofServer, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwt,
        extendedEphemeralPublicKey: '', // Will be filled by the proof server
        maxEpoch,
        jwtRandomness: randomness,
        salt,
        keyClaimName: 'sub',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get ZK proof');
    }

    const proof = await response.json();
    return proof;
  } catch (error) {
    console.error('Failed to get ZK proof:', error);
    throw error;
  }
}

// Compute zkLogin address
export function computeZkLoginAddress(
  userSalt: string,
  sub: string,
  aud: string
): string {
  // This is a simplified version. In production, use the actual zkLogin address computation
  // from @mysten/zklogin package
  const hash = require('crypto')
    .createHash('sha256')
    .update(userSalt + sub + aud)
    .digest('hex');
  return `0x${hash.slice(0, 64)}`;
}

// Complete zkLogin flow
export async function completeZkLogin(
  jwt: string,
  ephemeralKeyPair: Ed25519Keypair,
  randomness: string,
  maxEpoch: number
): Promise<{
  userAddress: string;
  salt: string;
  zkProof: any;
}> {
  try {
    // Parse JWT
    const jwtData = parseJWT(jwt);

    // Get salt
    const salt = await getSalt(jwt);

    // Get ZK proof
    const zkProof = await getZkProof(jwt, salt, randomness, maxEpoch);

    // Compute user address
    const userAddress = computeZkLoginAddress(salt, jwtData.sub, jwtData.aud);

    return {
      userAddress,
      salt,
      zkProof,
    };
  } catch (error) {
    console.error('Failed to complete zkLogin:', error);
    throw error;
  }
}

// Store zkLogin state in session
export function storeZkLoginState(state: Partial<ZkLoginState>) {
  const currentState = getZkLoginState();
  const newState = { ...currentState, ...state };
  sessionStorage.setItem('zkLoginState', JSON.stringify(newState));
}

// Get zkLogin state from session
export function getZkLoginState(): ZkLoginState | null {
  const state = sessionStorage.getItem('zkLoginState');
  if (!state) return null;

  try {
    return JSON.parse(state);
  } catch {
    return null;
  }
}

// Clear zkLogin state
export function clearZkLoginState() {
  sessionStorage.removeItem('zkLoginState');
}

// Validate zkLogin session
export function isZkLoginSessionValid(state: ZkLoginState | null): boolean {
  if (!state || !state.jwt || !state.userAddress) {
    return false;
  }

  try {
    const jwtData = parseJWT(state.jwt);
    const now = Math.floor(Date.now() / 1000);
    
    // Check if JWT is expired
    if (jwtData.exp < now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Create zkLogin signer
export async function createZkLoginSigner(
  ephemeralKeyPair: Ed25519Keypair,
  zkProof: any,
  jwt: string,
  salt: string
): Promise<any> {
  // This would return a proper zkLogin signer that can sign transactions
  // For now, returning a placeholder
  return {
    sign: async (data: Uint8Array) => {
      // Sign with ephemeral keypair and include ZK proof
      const signature = await ephemeralKeyPair.sign(data);
      return {
        signature,
        zkProof,
        jwt,
        salt,
      };
    },
    getPublicKey: () => ephemeralKeyPair.getPublicKey(),
  };
}

// Hash email for privacy
export function hashEmail(email: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

export default {
  generateEphemeralKeyPair,
  generateZkLoginNonce,
  initializeZkLogin,
  parseJWT,
  getSalt,
  getZkProof,
  computeZkLoginAddress,
  completeZkLogin,
  storeZkLoginState,
  getZkLoginState,
  clearZkLoginState,
  isZkLoginSessionValid,
  createZkLoginSigner,
  hashEmail,
};
