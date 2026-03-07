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
    { href: "/track", label: "TRACK ORDER" },
  ];

  return (
    <>
      {/* Top branding line */}
      <div className="w-full h-1 bg-groovy-purple" />

      {/* Main navbar - made sticky to keep it visible on scroll */}
      <nav className="bg-black/80 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-800 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left side: Logo and Desktop Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0">
                <img
                  src="/images/logo.jpg"
                  alt="Groovy Bugs Logo"
                  className="h-12 w-12 object-contain rounded-md"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="relative text-white font-mono text-sm font-bold uppercase tracking-wider py-2 transition-colors duration-300 hover:text-groovy-purple
                               after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-groovy-purple
                               after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side: Icons */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <button className="hidden sm:block p-2 text-white rounded-full hover:bg-gray-800 hover:text-groovy-purple transition-all duration-300">
                <Search className="h-5 w-5" />
              </button>

              {/* User Authentication */}
              {isSignedIn ? (
                <div className="h-8 w-8">
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="p-2 text-white rounded-full hover:bg-gray-800 hover:text-groovy-purple transition-all duration-300">
                    <User className="h-5 w-5" />
                  </button>
                </SignInButton>
              )}

              {/* Cart */}
              <button
                onClick={onCartClick}
                className="relative p-2 text-white rounded-full hover:bg-gray-800 hover:text-groovy-purple transition-all duration-300"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-groovy-purple text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-black">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden p-2 text-white rounded-full hover:bg-gray-800 hover:text-groovy-purple transition-all duration-300"
              >
                <span className="sr-only">Open main menu</span>
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
        <div
          id="mobile-menu"
          className={`lg:hidden absolute top-full left-0 w-full bg-black border-t border-gray-800 transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "transform translate-y-0" : "transform -translate-y-[150%]"
          }`}
        >
          <div className="px-4 pt-4 pb-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block text-white font-mono text-base font-bold uppercase tracking-wider rounded-md px-3 py-3 hover:bg-gray-900 hover:text-groovy-purple transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-700 my-4" />
            <button className="flex items-center space-x-3 w-full text-white font-mono text-base font-bold uppercase tracking-wider rounded-md px-3 py-3 hover:bg-gray-900 hover:text-groovy-purple transition-all duration-200">
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;