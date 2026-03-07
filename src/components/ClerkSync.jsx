// ClerkSync.jsx (frontend)
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ClerkSync = () => {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      const syncUser = async () => {
        try {
          await axios.post(`${API_BASE_URL}/api/users/clerk-sync`, {
            clerkId: user.id,
            image: user.imageUrl,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.emailAddresses[0]?.emailAddress,
          });
          console.log("User synced successfully with backend.");
        } catch (error) {
          console.error("Error syncing user:", error.response ? error.response.data : error.message);
        }
      };
      syncUser();
    }
  }, [isSignedIn, user]);

  return null;
};

export default ClerkSync;