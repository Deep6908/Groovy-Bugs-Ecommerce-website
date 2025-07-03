import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const UserProfile = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-groovy-gray/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <img
            src="/images/logo.jpg"
            alt="Groovy Bugs Logo"
            className="w-16 h-16 mx-auto mb-4 rounded-full"
          />
          <h2 className="text-white text-2xl sm:text-3xl font-bold">My Profile</h2>
        </div>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="text-center pb-6 border-b border-gray-600">
            <img
              src={user.imageUrl}
              alt={user.fullName || "User"}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-groovy-purple"
            />
            <h3 className="text-white text-xl font-bold mb-2">{user.fullName || "Welcome!"}</h3>
            <p className="text-gray-300">{user.primaryEmailAddress?.emailAddress}</p>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="text-groovy-purple text-lg font-bold">Account Information</h4>
            <div className="bg-black/30 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="text-white font-medium">User ID:</span>
                <span className="text-gray-300 text-sm break-all">{user.id}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="text-white font-medium">Username:</span>
                <span className="text-gray-300">{user.username || "Not set"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="text-white font-medium">Created:</span>
                <span className="text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h4 className="text-groovy-purple text-lg font-bold">Preferences</h4>
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-gray-300 mb-4">Manage your account settings and preferences</p>
              <Link
                to="/"
                className="btn-primary inline-block"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;