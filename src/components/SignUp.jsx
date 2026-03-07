import React, { useEffect, useState } from "react";
import { SignUp as ClerkSignUp, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import useClerkSync from "../Utils/ClerkSync";
import CompleteProfile from "../components/CompleteProfile"; // 🧩 Modal form


const SignUp = () => {
  const { isSignedIn } = useUser();
  const syncUser = useClerkSync();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  let cancelled = false;

  const isAddressComplete = addr =>
    !!addr &&
    addr.fullName &&
    addr.addressLine1 &&
    addr.city &&
    addr.state &&
    addr.postalCode &&
    addr.country &&
    addr.phone;

    if (isSignedIn) {
      setShowModal(false);
    }
  if (isSignedIn && user) {
    (async () => {
      await syncUser();
      try {
        const profile = await userAPI.getProfileDetails(user.id);
        const hasValidAddress =
          Array.isArray(profile.addresses) &&
          profile.addresses.length > 0 &&
          isAddressComplete(profile.addresses[0]);

        if (
          !profile.firstName ||
          !profile.lastName ||
          !profile.email ||
          !profile.gender ||
          !profile.dateOfBirth ||
          !hasValidAddress ||
          !profile.preferences ||
          !Array.isArray(profile.preferences.favoriteCategories) ||
          profile.preferences.favoriteCategories.length === 0
        ) {
          if (!cancelled) setShowModal(true);
        } else {
          if (!cancelled) setShowModal(false);
        }
      } catch (e) {
        if (!cancelled) setShowModal(true);
      }
      setProfileChecked(true);
    })();
  } else {
    setProfileChecked(false);
    setShowModal(false);
  }

  return () => { cancelled = true; };
}, [isSignedIn, user, syncUser]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md bg-groovy-gray/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl z-10">
        <div className="text-center mb-6">
          <img
            src="/images/logo.jpg"
            alt="Groovy Bugs Logo"
            className="w-16 h-16 mx-auto mb-4 rounded-full"
          />
          <h2 className="text-white text-2xl sm:text-3xl font-bold">Sign Up</h2>
        </div>
        <ClerkSignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-groovy-purple hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200",
              card: "bg-transparent shadow-none",
              headerTitle: "text-white text-xl font-bold text-center",
              headerSubtitle: "text-gray-300 text-center",
              socialButtonsBlockButton:
                "bg-groovy-gray border border-gray-600 text-white hover:bg-gray-600 transition-colors duration-200",
              formFieldInput:
                "bg-groovy-gray border border-gray-600 text-white rounded-lg p-3 focus:border-groovy-purple focus:ring-2 focus:ring-groovy-purple",
              footer: "text-gray-400 text-center",
              footerActionLink:
                "text-groovy-purple hover:text-purple-400 transition-colors duration-200",
            },
          }}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xl relative">
            <button
              className="absolute top-2 right-4 text-gray-500 hover:text-black"
              onClick={() => {
                setShowModal(false);
                navigate("/");
              }}
            >
              ✕
            </button>
            <CompleteProfile onClose={() => {
              setShowModal(false);
              navigate("/");
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;
