import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Define the token data interface
export interface TokenData {
  createdAt: Timestamp | FieldValue; // Firestore timestamp
  credentials: {
    accessToken?: string;
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
  linkedAt?: Timestamp | FieldValue | null;
}

// Collection name for tokens
const TOKEN_COLLECTION = 'smart-mirror-tokens';

// Get a reference to the tokens collection
const tokensCollection = adminDb.collection(TOKEN_COLLECTION);

/**
 * Create a new token document in Firestore
 */
export async function createToken(token: string): Promise<void> {
  try {
    await tokensCollection.doc(token).set({
      createdAt: FieldValue.serverTimestamp(),
      credentials: null,
      linkedAt: null
    });
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

/**
 * Check if a token exists in Firestore
 */
export async function hasToken(token: string): Promise<boolean> {
  try {
    const docSnapshot = await tokensCollection.doc(token).get();
    return docSnapshot.exists;
  } catch (error) {
    console.error('Error checking token existence:', error);
    return false;
  }
}

/**
 * Get a token's data from Firestore
 */
export async function getToken(token: string): Promise<TokenData | null> {
  try {
    const docSnapshot = await tokensCollection.doc(token).get();
    if (!docSnapshot.exists) {
      return null;
    }
    return docSnapshot.data() as TokenData;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * Update a token in Firestore
 */
export async function updateToken(token: string, data: Partial<TokenData>): Promise<void> {
  try {
    await tokensCollection.doc(token).update(data);
  } catch (error) {
    console.error('Error updating token:', error);
    throw error;
  }
}

/**
 * Completely remove a token from Firestore
 */
export async function deleteToken(token: string): Promise<void> {
  try {
    await tokensCollection.doc(token).delete();
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
}

/**
 * Clean up old tokens (older than one hour)
 */
export async function cleanupOldTokens(): Promise<void> {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const oldTokensSnapshot = await tokensCollection
      .where('createdAt', '<', oneHourAgo)
      .get();
    
    if (oldTokensSnapshot.empty) {
      return;
    }
    
    const batch = adminDb.batch();
    
    oldTokensSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${oldTokensSnapshot.size} expired tokens`);
  } catch (error) {
    console.error('Error cleaning up old tokens:', error);
  }
} 