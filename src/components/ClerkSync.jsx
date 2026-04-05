// ClerkSync.jsx — syncs authenticated Clerk user to MongoDB on sign-in
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import axios from 'axios';
import { setTokenGetter } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ClerkSync = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Bug 10 fix: keep the token getter up to date in the axios service
  // (CartContext also does this, but ClerkSync does it first as it mounts earlier)
  useEffect(() => {
    if (getToken) {
      setTokenGetter(getToken);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const syncUser = async () => {
        try {
          const token = await getToken();

          await axios.post(
            `${API_BASE_URL}/api/users/clerk-sync`,
            {
              // Note: backend now ignores clerkId from body and uses req.user.clerkId
              // Kept here for logging/debugging convenience only
              email: user.emailAddresses[0]?.emailAddress,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              image: user.imageUrl,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (error) {
          // 200 means user already exists — not an error
          if (error.response?.status !== 200) {
            console.error('Error syncing user:', error.response?.data || error.message);
          }
        }
      };
      syncUser();
    } else if (isLoaded && !isSignedIn) {
      // Clear stale cart from localStorage on sign-out to prevent ghost data
      localStorage.removeItem('cart');
    }
  }, [isSignedIn, user, isLoaded, getToken]);

  return null;
};

export default ClerkSync;