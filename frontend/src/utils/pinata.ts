import axios from 'axios';
import config from '../config';

const pinataAxios = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    'Content-Type': 'application/json',
    'pinata_api_key': config.pinata.apiKey,
    'pinata_secret_api_key': config.pinata.secretKey,
  },
});

// If JWT is available, use it instead
if (config.pinata.jwt) {
  pinataAxios.defaults.headers.common['Authorization'] = `Bearer ${config.pinata.jwt}`;
  delete pinataAxios.defaults.headers.common['pinata_api_key'];
  delete pinataAxios.defaults.headers.common['pinata_secret_api_key'];
}

export interface PinataMetadata {
  name: string;
  keyvalues?: Record<string, string | number>;
}

export interface PinataOptions {
  cidVersion?: 0 | 1;
  wrapWithDirectory?: boolean;
}

export interface UploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

// Upload file to Pinata
export async function uploadFile(
  file: File,
  metadata?: PinataMetadata,
  options?: PinataOptions
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      formData.append('pinataMetadata', JSON.stringify(metadata));
    }

    if (options) {
      formData.append('pinataOptions', JSON.stringify(options));
    }

    const response = await axios.post(
      config.pinata.uploadEndpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': config.pinata.apiKey,
          'pinata_secret_api_key': config.pinata.secretKey,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to upload file to Pinata:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload file');
  }
}

// Upload JSON to Pinata
export async function uploadJSON(
  jsonData: any,
  metadata?: PinataMetadata,
  options?: PinataOptions
): Promise<UploadResponse> {
  try {
    const data = {
      pinataContent: jsonData,
      pinataMetadata: metadata || {},
      pinataOptions: options || {},
    };

    const response = await pinataAxios.post('/pinning/pinJSONToIPFS', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to upload JSON to Pinata:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload JSON');
  }
}

// Upload product metadata
export async function uploadProductMetadata(productData: {
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  originLocation: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  createdAt: number;
  attributes?: Record<string, any>;
}): Promise<string> {
  try {
    const metadata: PinataMetadata = {
      name: `Thalexa Product - ${productData.name}`,
      keyvalues: {
        type: 'product',
        category: productData.category,
        manufacturer: productData.manufacturer,
        batchNumber: productData.batchNumber,
      },
    };

    const result = await uploadJSON(productData, metadata);
    return result.IpfsHash;
  } catch (error) {
    console.error('Failed to upload product metadata:', error);
    throw error;
  }
}

// Upload product image
export async function uploadProductImage(
  imageFile: File,
  productName: string
): Promise<string> {
  try {
    const metadata: PinataMetadata = {
      name: `Thalexa Product Image - ${productName}`,
      keyvalues: {
        type: 'product-image',
        productName,
      },
    };

    const result = await uploadFile(imageFile, metadata);
    return result.IpfsHash;
  } catch (error) {
    console.error('Failed to upload product image:', error);
    throw error;
  }
}

// Upload verification document
export async function uploadVerificationDocument(
  documentFile: File,
  documentType: string,
  productId: string
): Promise<string> {
  try {
    const metadata: PinataMetadata = {
      name: `Thalexa Verification - ${documentType}`,
      keyvalues: {
        type: 'verification',
        documentType,
        productId,
      },
    };

    const result = await uploadFile(documentFile, metadata);
    return result.IpfsHash;
  } catch (error) {
    console.error('Failed to upload verification document:', error);
    throw error;
  }
}

// Get file from IPFS
export function getIPFSUrl(ipfsHash: string): string {
  return `${config.pinata.gateway}${ipfsHash}`;
}

// Fetch JSON from IPFS
export async function fetchJSON(ipfsHash: string): Promise<any> {
  try {
    const url = getIPFSUrl(ipfsHash);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch JSON from IPFS:', error);
    throw error;
  }
}

// Test Pinata connection
export async function testConnection(): Promise<boolean> {
  try {
    await pinataAxios.get('/data/testAuthentication');
    return true;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
}

// Pin by hash (pin existing content)
export async function pinByHash(
  ipfsHash: string,
  metadata?: PinataMetadata
): Promise<void> {
  try {
    const data = {
      hashToPin: ipfsHash,
      pinataMetadata: metadata || {},
    };

    await pinataAxios.post('/pinning/pinByHash', data);
  } catch (error: any) {
    console.error('Failed to pin by hash:', error);
    throw new Error(error.response?.data?.error || 'Failed to pin content');
  }
}

// Unpin content
export async function unpin(ipfsHash: string): Promise<void> {
  try {
    await pinataAxios.delete(`/pinning/unpin/${ipfsHash}`);
  } catch (error: any) {
    console.error('Failed to unpin content:', error);
    throw new Error(error.response?.data?.error || 'Failed to unpin content');
  }
}

// Get pin list
export async function getPinList(filters?: {
  status?: 'pinned' | 'unpinned';
  metadata?: Record<string, string | number>;
  pageLimit?: number;
  pageOffset?: number;
}): Promise<any> {
  try {
    const response = await pinataAxios.get('/data/pinList', {
      params: filters,
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to get pin list:', error);
    throw new Error(error.response?.data?.error || 'Failed to get pin list');
  }
}

// Update metadata
export async function updateMetadata(
  ipfsHash: string,
  metadata: PinataMetadata
): Promise<void> {
  try {
    const data = {
      ipfsPinHash: ipfsHash,
      name: metadata.name,
      keyvalues: metadata.keyvalues || {},
    };

    await pinataAxios.put('/pinning/hashMetadata', data);
  } catch (error: any) {
    console.error('Failed to update metadata:', error);
    throw new Error(error.response?.data?.error || 'Failed to update metadata');
  }
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Validate file size
export function validateFileSize(file: File, maxSize: number = config.app.maxUploadSize): boolean {
  return file.size <= maxSize;
}

// Validate file type
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Generate unique filename
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.replace(`.${extension}`, '');
  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
}

// Compress image before upload (client-side)
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export default {
  uploadFile,
  uploadJSON,
  uploadProductMetadata,
  uploadProductImage,
  uploadVerificationDocument,
  getIPFSUrl,
  fetchJSON,
  testConnection,
  pinByHash,
  unpin,
  getPinList,
  updateMetadata,
  fileToBase64,
  validateFileSize,
  validateFileType,
  getFileExtension,
  generateUniqueFilename,
  compressImage,
};
