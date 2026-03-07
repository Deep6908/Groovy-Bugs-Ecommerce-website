import React from "react";
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import useClerkSync from "../Utils/ClerkSync"; // ONLY if alias `@` points to `src/`

const SignIn = () => {
  const { isSignedIn } = useUser();
  const syncUser = useClerkSync();

  useEffect(() => {
    if (isSignedIn) {
      syncUser(); // send to backend
    }
  }, [isSignedIn]);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-groovy-gray/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <img
            src="/images/logo.jpg"
            alt="Groovy Bugs Logo"
            className="w-16 h-16 mx-auto mb-4 rounded-full"
          />
          <h2 className="text-white text-2xl sm:text-3xl font-bold">Sign In</h2>
        </div>
        
        <ClerkSignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              formButtonPrimary: "bg-groovy-purple hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200",
              card: "bg-transparent shadow-none",
              headerTitle: "text-white text-xl font-bold text-center",
              headerSubtitle: "text-gray-300 text-center",
              socialButtonsBlockButton: "bg-groovy-gray border border-gray-600 text-white hover:bg-gray-600 transition-colors duration-200",
              formFieldInput: "bg-groovy-gray border border-gray-600 text-white rounded-lg p-3 focus:border-groovy-purple focus:ring-2 focus:ring-groovy-purple",
              footer: "text-gray-400 text-center",
              footerActionLink: "text-groovy-purple hover:text-purple-400 transition-colors duration-200",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignIn;