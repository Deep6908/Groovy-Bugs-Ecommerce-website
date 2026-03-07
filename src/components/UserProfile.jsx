import React from "react";
import { useUser } from "@clerk/clerk-react";

const UserProfile = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="bg-main-bg min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-main-bg min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <img
              src="/images/logo.jpg"
              alt="Groovy Bugs Logo"
              className="w-20 h-20 mx-auto mb-6 rounded-full"
            />
            <h2 className="text-3xl font-black text-white font-mono tracking-wider uppercase mb-2">
              My Profile
            </h2>
          </div>

          <div className="space-y-8">
            {/* Profile Header */}
            <div className="text-center pb-8 border-b border-gray-700">
              <img
                src={user.imageUrl}
                alt={user.fullName || "User"}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-main-purple"
              />
              <h3 className="text-2xl font-bold text-white mb-2 font-mono">
                {user.fullName || "Welcome!"}
              </h3>
              <p className="text-gray-400 font-mono">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>

            {/* Account Information */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4 font-mono uppercase tracking-wider">
                Account Information
              </h4>
              <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 font-mono">User ID:</span>
                  <span className="text-white font-mono text-sm">{user.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 font-mono">Username:</span>
                  <span className="text-white font-mono">{user.username || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400 font-mono">Member Since:</span>
                  <span className="text-white font-mono">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4 font-mono uppercase tracking-wider">
                Quick Actions
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  className="bg-main-purple text-white border-none rounded-lg py-3 px-6 font-mono font-bold hover:bg-purple-600 transition-colors duration-200"
                  onClick={() => (window.location.href = "/cart")}
                >
                  View Cart
                </button>
                <button
                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-3 px-6 font-mono font-bold hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => (window.location.href = "/")}
                >
                  Back to Home
                </button>
              </div>
            </div>

            {/* Order History Placeholder */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4 font-mono uppercase tracking-wider">
                Recent Orders
              </h4>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-400 font-mono">No orders yet</p>
                <button
                  className="mt-4 bg-accent-pink text-white border-none rounded-lg py-2 px-6 font-mono font-bold hover:bg-pink-600 transition-colors duration-200"
                  onClick={() => (window.location.href = "/shop")}
                >
                  Start Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;