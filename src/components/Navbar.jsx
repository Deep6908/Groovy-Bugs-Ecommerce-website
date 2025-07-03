import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, UserButton, SignInButton } from "@clerk/clerk-react";
import { Menu, X, Search, ShoppingCart, User } from "lucide-react";

const Navbar = ({ cartCount, onCartClick }) => {
  const { isSignedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/tees", label: "TEES" },
    { href: "/tote-bags", label: "TOTE BAGS" },
    { href: "/posters", label: "POSTERS" },
    { href: "/shop", label: "SHOP ALL" },
    { href: "/contact", label: "CONTACT US" },
    { href: "/track", label: "TRACK ORDER" },
  ];

  return (
    <>
      {/* Top line */}
      <div className="w-full h-1 bg-groovy-purple fixed top-0 left-0 z-50"></div>

      {/* Main navbar */}
      <nav className="bg-black sticky top-0 z-40 border-b border-gray-800 navbar-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img
                  src="/images/logo.jpg"
                  alt="Groovy Bugs Logo"
                  className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:block flex-1 mx-8">
              <div className="flex items-center justify-center space-x-6 xl:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-white font-mono text-sm font-bold uppercase tracking-wider hover:text-groovy-purple transition-colors duration-200 border-b-2 border-transparent hover:border-groovy-purple py-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Search Icon - Hidden on mobile */}
              <button className="hidden sm:block text-white hover:text-groovy-purple transition-colors duration-200">
                <Search className="h-5 w-5" />
              </button>

              {/* User Authentication */}
              {isSignedIn ? (
                <Link
                  to="/profile"
                  className="flex items-center justify-center"
                >
                  <UserButton afterSignOutUrl="/" />
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className="text-white hover:text-groovy-purple transition-colors duration-200">
                    <User className="h-5 w-5" />
                  </button>
                </SignInButton>
              )}

              {/* Cart */}
              <button
                onClick={onCartClick}
                className="relative text-white hover:text-groovy-purple transition-colors duration-200"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-groovy-purple text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden text-white hover:text-groovy-purple transition-colors duration-200"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-black border-t border-gray-800 animate-slide-up">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block text-white font-mono text-sm font-bold uppercase tracking-wider hover:text-groovy-purple transition-colors duration-200 py-2 border-b border-gray-800 last:border-b-0"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Search */}
              <button className="flex items-center space-x-2 text-white hover:text-groovy-purple transition-colors duration-200 py-2 w-full">
                <Search className="h-5 w-5" />
                <span className="font-mono text-sm font-bold uppercase tracking-wider">
                  Search
                </span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
