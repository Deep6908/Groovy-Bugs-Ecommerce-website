import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import Navbar from "./components/Navbar";
import CartSidebar from "./components/CartSidebar";
import Footer from "./components/Footer";
import CartPage from "./components/CartPage";
import ProductDetails from "./components/ProductDetails";
import CollectionsPage from "./components/CollectionsPage";
import PostersPage from "./components/PostersPage";
import ToteBagsPage from "./components/ToteBagsPage";
import TeesPage from "./components/TeesPage";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import UserProfile from "./components/UserProfile";
import HeroSlider from "./components/HeroSlider";
import ProductSlider from "./components/ProductSlider";
import InfoCards from "./components/InfoCards";
import products from "./data/products";
import extraPosters from "./data/extraPosters";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
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

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/sign-in" || location.pathname === "/sign-up";

  const handleAddToCart = (product) => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      toast.error("Please Sign In first!");
      return;
    }

    setCart((prev) => [...prev, product]);
    setIsCartOpen(true);
    toast.success("Hurray! Your product has been added to the Cart!");
  };

  const handleRemoveFromCart = (id) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx !== -1) {
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      return prev;
    });
  };

  const handleIncreaseQuantity = (id) => {
    const productToAdd = cart.find((item) => item.id === id);
    if (productToAdd) {
      setCart((prev) => [...prev, productToAdd]);
    }
  };

  const handleDecreaseQuantity = (id) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx !== -1) {
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      return prev;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cart]);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const ProductDetailsWrapper = ({ onAddToCart }) => {
    const { id } = useParams();
    const product =
      products.find((p) => p.id === Number(id)) ||
      extraPosters.find((p) => p.id === Number(id));
    return <ProductDetails product={product} onAddToCart={onAddToCart} />;
  };

  // Show loading screen while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-black ${
        isAuthPage ? "bg-cover bg-center bg-no-repeat" : ""
      }`}
      style={isAuthPage ? { backgroundImage: "url('/images/bg.jpg')" } : {}}
    >
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
        className="mt-16 sm:mt-20"
        toastClassName="bg-gray-800 text-white border border-groovy-purple"
      />

      <Navbar cartCount={cart.length} onCartClick={toggleCart} />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
      />

      <main className="min-h-screen">
        <Routes>
          <Route
            path="/"
            element={
              <div className="bg-black">
                <HeroSlider />
                <section className="section bg-black">
                  <h2 className="text-white text-xl sm:text-2xl font-semi-bold font-display  uppercase mb-10 text-center">
                    Featured Products
                  </h2>
                  <ProductSlider
                    products={products.filter((p) => p.featured)}
                    onAddToCart={handleAddToCart}
                  />
                </section>
                <InfoCards />
              </div>
            }
          />
          <Route path="/shop" element={<CollectionsPage />} />
          <Route
            path="/product/:id"
            element={<ProductDetailsWrapper onAddToCart={handleAddToCart} />}
          />
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
                <CartPage cart={cart} onRemoveFromCart={handleRemoveFromCart} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

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
