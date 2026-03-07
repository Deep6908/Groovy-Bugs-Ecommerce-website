import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, Link, useLocation, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductList from "./components/ProductList";
import Footer from "./components/Footer";
import CartPage from "./components/CartPage";
import CartSidebar from "./components/CartSidebar";
import ProductDetails from "./components/ProductDetails";
import ShopPage from "./components/ShopPage";
import HeroSlider from "./components/HeroSlider";
import ProductSlider from "./components/ProductSlider";
import CollectionsPage from "./components/CollectionsPage";
import PostersPage from "./components/PostersPage";
import ToteBagsPage from "./components/ToteBagsPage";
import TeesPage from "./components/TeesPage";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import UserProfile from "./components/UserProfile";
import InfoCards from "./components/InfoCards";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import ClerkSync from "./components/ClerkSync";
import CompleteProfile from "./components/CompleteProfile";


// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-main-bg">
        <div className="text-white text-xl font-mono">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const isAuthPage = location.pathname === "/sign-in" || location.pathname === "/sign-up";
  const [showProfileModal, setShowProfileModal] = useState(false);

  // --- NEW STATE FOR CART SIDEBAR ---
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (isSignedIn && user && isLoaded) {
        try {
          const res = await fetch(`/api/users/profile-details/${user.id}`);
          if (!res.ok) {
            console.warn(`Profile details for user ${user.id} not found or error: ${res.status}`);
            setShowProfileModal(true);
            return;
          }
          const data = await res.json();

          if (!data || !data.name || !data.gender) {
            setShowProfileModal(true);
          }
        } catch (error) {
          console.error("Error fetching user profile details:", error);
          setShowProfileModal(true);
        }
      }
    };

    if (isLoaded) {
        checkProfileCompletion();
    }
  }, [isSignedIn, user, isLoaded]);

  const handleCloseModal = () => setShowProfileModal(false);

  // --- NEW FUNCTION TO TOGGLE CART SIDEBAR ---
  const toggleCartSidebar = () => {
    setIsCartSidebarOpen(prev => !prev);
  };

  return (
    <ProductProvider>
      <CartProvider>
        <ClerkSync />
        <div className={`min-h-screen ${isAuthPage ? "login-bg" : "bg-main-bg"}`}>
          <div className="grain-overlay"></div>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />

          {/* Pass toggleCartSidebar to Navbar */}
          {!isAuthPage && <Navbar onCartClick={toggleCartSidebar} />}

          {showProfileModal && isSignedIn && (
            <CompleteProfile onClose={handleCloseModal} />
          )}

          <div className="relative z-10">
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <HeroSlider />
                    <h2 className="section-title text-center text-white text-4xl font-black font-mono tracking-wider uppercase my-12">Featured Products</h2>
                    <ProductSlider />
                    <InfoCards />
                  </>
                }
              />
              <Route path="/shop" element={<CollectionsPage />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/posters" element={<PostersPage />} />
              <Route path="/tote-bags" element={<ToteBagsPage />} />
              <Route path="/tees" element={<TeesPage />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>

          {/* Pass isCartSidebarOpen and toggleCartSidebar to CartSidebar */}
          {!isAuthPage && (
            <CartSidebar isOpen={isCartSidebarOpen} onClose={toggleCartSidebar} />
          )}

          {!isAuthPage && <Footer />}
        </div>
      </CartProvider>
    </ProductProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}