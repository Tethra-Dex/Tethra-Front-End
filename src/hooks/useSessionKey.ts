import { useState, useEffect } from 'react';
import { keccak256, toHex, hashMessage, recoverMessageAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export interface SessionKey {
  privateKey: `0x${string}`;
  address: string;
  expiresAt: number;
  authorizedBy: string;
  authSignature: string;
  createdAt: number;
}

const SESSION_STORAGE_KEY = 'tethra_session_key';
const DEFAULT_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export function useSessionKey() {
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load session key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: SessionKey = JSON.parse(stored);
        // Check if expired
        if (parsed.expiresAt > Date.now()) {
          setSessionKey(parsed);
          console.log('✅ Loaded existing session key, expires in:', Math.round((parsed.expiresAt - Date.now()) / 1000 / 60), 'minutes');
        } else {
          console.log('⏰ Session key expired, clearing...');
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Failed to parse session key:', err);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  /**
   * Check if current session is valid (exists and not expired)
   */
  const isSessionValid = (): boolean => {
    if (!sessionKey) return false;
    if (sessionKey.expiresAt <= Date.now()) {
      console.log('⏰ Session expired');
      clearSession();
      return false;
    }
    return true;
  };

  /**
   * Create a new session key
   * User must sign a message authorizing this ephemeral key
   */
  const createSession = async (
    userAddress: string,
    walletClient: any,
    durationMs: number = DEFAULT_SESSION_DURATION
  ): Promise<SessionKey | null> => {
    try {
      setIsLoading(true);

      // Generate random private key for session
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      const privateKey = `0x${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;

      // Derive address from private key
      const sessionAccount = privateKeyToAccount(privateKey);
      const sessionAddress = sessionAccount.address;

      const expiresAt = Date.now() + durationMs;
      const expiresAtSeconds = Math.floor(expiresAt / 1000);

      console.log('🔑 Generated session key:', sessionAddress);
      console.log('⏰ Expires at:', new Date(expiresAt).toLocaleString());

      // Create authorization message
      // Format: "Authorize session key {address} for Tethra Tap-to-Trade until {timestamp}"
      const authMessage = `Authorize session key ${sessionAddress} for Tethra Tap-to-Trade until ${expiresAtSeconds}`;
      const authMessageHash = keccak256(toHex(authMessage));

      console.log('✍️ Requesting user signature to authorize session...');

      // User signs authorization (this is the ONLY signature needed!)
      const authSignature = await walletClient.request({
        method: 'personal_sign',
        params: [authMessageHash, userAddress],
      });

      console.log('✅ Session authorized!');

      const newSession: SessionKey = {
        privateKey,
        address: sessionAddress,
        expiresAt,
        authorizedBy: userAddress.toLowerCase(),
        authSignature: authSignature as string,
        createdAt: Date.now(),
      };

      // Store in state and localStorage
      setSessionKey(newSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));

      return newSession;
    } catch (err: any) {
      console.error('Failed to create session:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign a message using the session key (no user prompt!)
   * IMPORTANT: Uses hashMessage to match ethers.verifyMessage behavior
   */
  const signWithSession = async (messageHash: `0x${string}`): Promise<string | null> => {
    if (!isSessionValid()) {
      console.error('❌ No valid session key');
      return null;
    }

    try {
      const sessionAccount = privateKeyToAccount(sessionKey!.privateKey);

      // Hash the message with Ethereum signed message prefix
      // This creates the same hash that ethers.verifyMessage expects
      const digest = hashMessage({ raw: messageHash });

      // Sign the digest using raw ECDSA (no additional hashing)
      const signature = await sessionAccount.sign({ hash: digest });

      console.log('✅ Signed with session key (no user prompt!)');
      console.log('🔑 Session account address:', sessionAccount.address);
      console.log('📝 Original message hash:', messageHash);
      console.log('📝 Digest (with prefix):', digest);
      console.log('✍️ Signature produced:', signature);

      // Verify locally that signature is correct
      const recovered = await recoverMessageAddress({
        message: { raw: messageHash },
        signature,
      });
      console.log('🔍 Recovered address (verification):', recovered);
      console.log('✅ Match?', recovered.toLowerCase() === sessionAccount.address.toLowerCase());

      return signature;
    } catch (err) {
      console.error('Failed to sign with session:', err);
      return null;
    }
  };

  /**
   * Clear current session
   */
  const clearSession = () => {
    setSessionKey(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('🗑️ Session cleared');
  };

  /**
   * Get time remaining in session (milliseconds)
   */
  const getTimeRemaining = (): number => {
    if (!sessionKey) return 0;
    return Math.max(0, sessionKey.expiresAt - Date.now());
  };

  return {
    sessionKey,
    isSessionValid,
    createSession,
    signWithSession,
    clearSession,
    getTimeRemaining,
    isLoading,
  };
}
