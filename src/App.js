import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, Link, useLocation, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductList from "./components/ProductList";
import Footer from "./components/Footer";
import CartPage from "./components/CartPage";
import CartSidebar from "./components/CartSidebar";
import products from "./data/products";
import ProductDetails from "./components/ProductDetails";
// import ShopPage from "./components/ShopPage";
import HeroSlider from "./components/HeroSlider";
import ProductSlider from "./components/ProductSlider";
import CollectionsPage from "./components/CollectionsPage";
import PostersPage from "./components/PostersPage";
import ToteBagsPage from "./components/ToteBagsPage";
import TeesPage from "./components/TeesPage";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import UserProfile from "./components/UserProfile";
import extraPosters from "./data/extraPosters";
import InfoCards from "./components/InfoCards";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return children;
};

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === "/sign-in" || location.pathname === "/sign-up";

  const handleAddToCart = (product) => {
    if (!isLoaded) {
      // Clerk is still loading, do nothing or show a loading indicator
      return;
    }

    if (!isSignedIn) {
      if (user === null) {
        // User is not signed in and has no account (or not loaded yet to determine)
        toast.error("Please Sign In first!");
      } else {
        // User has an account but is not logged in
        toast.error("Please Log in to your account!");
      }
      return;
    }

    setCart((prev) => [...prev, product]);
    setIsCartOpen(true); // Open cart sidebar when adding an item
    toast.success("Hurray! Your product has been added to the Cart!");
  };

  const handleRemoveFromCart = (id) => {
    setCart((prev) => {
      const idx = prev.findIndex(item => item.id === id);
      if (idx !== -1) {
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      return prev;
    });
  };

  const handleIncreaseQuantity = (id) => {
    // Add one more of the same product to the cart
    const productToAdd = cart.find(item => item.id === id);
    if (productToAdd) {
      setCart(prev => [...prev, productToAdd]);
    }
  };

  const handleDecreaseQuantity = (id) => {
    setCart(prev => {
      // Find the index of the first occurrence of the product
      const idx = prev.findIndex(item => item.id === id);
      if (idx !== -1) {
        // Remove only one occurrence of the product
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      return prev;
    });
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const ProductDetailsWrapper = ({ onAddToCart }) => {
    const { id } = useParams();
    const product = products.find(p => p.id === Number(id)) || extraPosters.find(p => p.id === Number(id));
    return <ProductDetails product={product} onAddToCart={onAddToCart} />;
  };

  return (
    <div
      className={`App${isAuthPage ? " login-bg" : ""}`}
      style={isAuthPage ? {
        background: "url('/images/bg.jpg') center center/cover no-repeat",
        minHeight: "100vh",
        width: "100vw"
      } : {}}
    >
      <div className="grain-overlay"></div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Navbar cartCount={cart.length} onCartClick={toggleCart} />
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        onRemoveFromCart={handleRemoveFromCart}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity} 
      />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HeroSlider />
              <h2 className="section-title">Featured Products</h2>
              <ProductSlider products={products.filter(p => p.featured)} onAddToCart={handleAddToCart} />
              <InfoCards />
            </>
          }
        />
        <Route
          path="/shop"
          element={<CollectionsPage />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetailsWrapper onAddToCart={handleAddToCart} />}
        />
        <Route
          path="/posters"
          element={<PostersPage />}
        />
        <Route
          path="/tote-bags"
          element={<ToteBagsPage />}
        />
        <Route
          path="/tees"
          element={<TeesPage />}
        />
        <Route
          path="/sign-in"
          element={<SignIn />}
        />
        <Route
          path="/sign-up"
          element={<SignUp />}
        />
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
              <CartPage cart={cart} onRemoveFromCart={handleRemoveFromCart} />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
