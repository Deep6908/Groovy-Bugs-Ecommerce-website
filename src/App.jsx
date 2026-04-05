import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartPage from "./components/CartPage";
import CartSidebar from "./components/CartSidebar";
import ProductDetails from "./components/ProductDetails";
import HeroSlider from "./components/HeroSlider";
import ProductSlider from "./components/ProductSlider";
import CollectionsPage from "./components/CollectionsPage";
import PostersPage from "./components/PostersPage";
import ToteBagsPage from "./components/ToteBagsPage";
import AccessoriesPage from "./components/AccessoriesPage";
import PouchBagsPage from "./components/PouchBagsPage";
import CropTopsPage from "./components/CropTopsPage";
import TeesPage from "./components/TeesPage";
import CustomisePage from "./components/CustomisePage";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import UserProfile from "./components/UserProfile";
import InfoCards from "./components/InfoCards";
import OrderConfirmationPage from "./components/OrderConfirmationPage";
import AdminOrdersPage from "./components/AdminOrdersPage";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProductProvider } from './context/ProductContext';
import { CartProvider, useCart } from './context/CartContext';
import ClerkSync from "./components/ClerkSync";
import CompleteProfile from "./components/CompleteProfile";

// ─── Route Guards ──────────────────────────────────────────────────────────

/** Redirects to /sign-in if the user is not authenticated */
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
};

/**
 * Restricts access to the shop owner.
 * Set VITE_ADMIN_CLERK_ID in .env to your Clerk user ID.
 * Falls back to blocking all access if the env var is missing.
 */
const AdminRoute = ({ children }) => {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const adminClerkId = import.meta.env.VITE_ADMIN_CLERK_ID;

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  if (!adminClerkId) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-mono text-lg mb-2">⚠️ Admin not configured</p>
          <p className="text-gray-400 font-mono text-sm">Set VITE_ADMIN_CLERK_ID in your .env file.</p>
        </div>
      </div>
    );
  }

  if (userId !== adminClerkId) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-mono text-2xl mb-2">🔒 Access Denied</p>
          <p className="text-gray-400 font-mono text-sm mb-6">You don't have permission to view this page.</p>
          <Link to="/" className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-mono text-sm no-underline">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-main-bg">
    <div className="text-white text-xl font-mono animate-pulse">Loading...</div>
  </div>
);

// ─── App Content ───────────────────────────────────────────────────────────

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  const isAuthPage  = ["/sign-in", "/sign-up"].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith("/admin");

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const { cart } = useCart();

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (isSignedIn && user && isLoaded) {
        try {
          const res = await fetch(`/api/users/profile-details/${user.id}`);
          if (!res.ok) { setShowProfileModal(true); return; }
          const data = await res.json();
          // Bug 12 fix: API returns firstName, not name
          if (!data || !data.firstName || !data.gender) {
            setShowProfileModal(true);
          }
        } catch (error) {
          console.error("Profile check error:", error);
        }
      }
    };
    if (isLoaded) checkProfileCompletion();
  }, [isSignedIn, user, isLoaded]);

  const toggleCartSidebar = () => setIsCartSidebarOpen(prev => !prev);

  return (
    <div className={`min-h-screen ${isAuthPage ? "login-bg" : "bg-main-bg"}`}>
      <ClerkSync />
      <div className="grain-overlay" />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {!isAuthPage && !isAdminPage && (
        <Navbar cartCount={cartCount} onCartClick={toggleCartSidebar} />
      )}

      {/* Admin navbar */}
      {isAdminPage && (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-950 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-purple-400 font-black font-mono text-lg no-underline tracking-widest">
            GROOVY BUGS <span className="text-gray-500 text-sm">ADMIN</span>
          </Link>
          <div className="flex gap-4 font-mono text-sm">
            <Link to="/admin/orders"    className="text-gray-300 hover:text-white no-underline transition-colors">📦 Orders</Link>
            <Link to="/"               className="text-gray-500 hover:text-gray-300 no-underline transition-colors">← Store</Link>
          </div>
        </nav>
      )}

      {showProfileModal && isSignedIn && (
        <CompleteProfile onClose={() => setShowProfileModal(false)} />
      )}

      <div className="relative z-10">
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={
            <>
              <HeroSlider />
              <h2 className="section-title text-center text-white text-4xl font-black font-mono tracking-wider uppercase my-12">
                Featured Products
              </h2>
              <ProductSlider />
              <InfoCards />
            </>
          } />

          <Route path="/shop"          element={<CollectionsPage />} />
          <Route path="/product/:id"   element={<ProductDetails />} />
          <Route path="/posters"       element={<PostersPage />} />
          <Route path="/tote-bags"     element={<ToteBagsPage />} />
          <Route path="/accessories"   element={<AccessoriesPage />} />
          <Route path="/pouch-bags"    element={<PouchBagsPage />} />
          <Route path="/crop-tops"     element={<CropTopsPage />} />
          <Route path="/tees"          element={<TeesPage />} />
          <Route path="/customise"     element={<CustomisePage />} />
          <Route path="/sign-in"       element={<SignIn />} />
          <Route path="/sign-up"       element={<SignUp />} />

          {/* Order confirmation — accessible to everyone (guests need it too) */}
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />

          {/* ── Auth-protected ── */}
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/cart"    element={<ProtectedRoute><CartPage /></ProtectedRoute>} />

          {/* ── Admin-protected ── */}
          <Route path="/admin/orders"    element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />

          {/* 404 catch-all */}
          <Route path="*" element={
            <div className="min-h-screen bg-main-bg flex flex-col items-center justify-center gap-4">
              <h1 className="text-6xl font-black text-purple-400 font-mono">404</h1>
              <p className="text-gray-400 font-mono">Hmm, this page doesn't exist.</p>
              <Link to="/" className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-mono text-sm no-underline">
                Back Home
              </Link>
            </div>
          } />
        </Routes>
      </div>

      {!isAuthPage && !isAdminPage && (
        <CartSidebar isOpen={isCartSidebarOpen} onClose={toggleCartSidebar} />
      )}

      {!isAuthPage && !isAdminPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ProductProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ProductProvider>
    </Router>
  );
}