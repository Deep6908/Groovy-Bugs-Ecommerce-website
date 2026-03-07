import axios from 'axios';
import { useUser } from '@clerk/clerk-react';

const useClerkSync = () => {
  const { user } = useUser();

  const syncUser = async () => {
    if (!user) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users/clerk-sync`, {
        clerkId: user.id,
        email: user.primaryEmailAddress.emailAddress,
        name: `${user.firstName} ${user.lastName}`,
        image: user.imageUrl
      });
    } catch (err) {
      console.error('User sync failed:', err);
    }
  };

  return syncUser;
};

export default useClerkSync;
