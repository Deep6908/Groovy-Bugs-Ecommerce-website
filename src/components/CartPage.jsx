import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { buildWhatsAppOrderUrl } from "../services/whatsapp";
import { orderAPI } from "../services/api";
import { IoLogoWhatsapp } from "react-icons/io5";

const CartPage = () => {
  const { getGroupedCart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { userId, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const groupedItems = getGroupedCart();
  const subtotal = getCartTotal();

  const handleBuyOnWhatsApp = async () => {
    if (groupedItems.length === 0) {
      toast.error("Your cart is empty.", { theme: "dark" });
      return;
    }

    // Build URL first so the fallback always works
    const fallbackUrl = buildWhatsAppOrderUrl({
      items: groupedItems,
      subtotal,
    });

    if (!fallbackUrl) {
      toast.error("Set VITE_OWNER_WHATSAPP_NUMBER in .env to enable WhatsApp orders.", { theme: "dark" });
      return;
    }

    // Try to save pending order to MongoDB
    let orderNumber = '';
    let orderId     = '';
    try {
      const result = await orderAPI.createWhatsApp({
        items: groupedItems.map(i => ({
          productId: i.product || null,
          name:      i.name,
          image:     i.image  || '',
          size:      i.size   || null,
          quantity:  i.quantity,
          price:     i.price,
        })),
        subtotal,
        userId:    userId || null,
        userEmail: user?.primaryEmailAddress?.emailAddress || null,
        // CartPage doesn't collect address — that's done in CartSidebar
        shippingAddress: {
          fullName:     'To be confirmed',
          addressLine1: 'Via WhatsApp',
          city:         'India',
          state:        'India',
          postalCode:   '000000',
          phone:        '0000000000',
        },
      });
      orderNumber = result.orderNumber || '';
      orderId     = result.orderId     || '';
    } catch (err) {
      // Fallback: log silently, still open WhatsApp
      console.warn('Order save failed (CartPage), still opening WhatsApp:', err.message);
    }

    // Always open WhatsApp
    const finalUrl = buildWhatsAppOrderUrl({ items: groupedItems, subtotal, orderRef: orderNumber });
    window.open(finalUrl, "_blank", "noopener,noreferrer");

    // Clear cart + redirect if we got an orderId
    try { await clearCart(); } catch (_) {}
    if (orderId) {
      navigate(`/order-confirmation/${orderId}?ref=${orderNumber}`);
    } else {
      navigate(`/order-confirmation/guest?ref=${orderNumber || 'pending'}`);
    }
  };

  return (
    <section className="min-h-screen bg-main-bg py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-white text-center mb-12 font-mono tracking-wider uppercase">
          Your Cart
        </h1>

        {groupedItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-400 mb-8 font-mono">Your cart is empty.</p>
            <Link
              to="/shop"
              className="inline-block bg-main-purple text-white border-none rounded-2xl py-3 px-8 text-lg font-bold cursor-pointer hover:bg-purple-600 transition-colors duration-200 font-mono tracking-wider no-underline"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Items */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              {groupedItems.map((item, index) => (
                <div
                  key={`${item.product}-${item.size || 'one-size'}`}
                  className={`flex items-center gap-6 py-6 ${index !== groupedItems.length - 1 ? 'border-b border-gray-800' : ''}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg bg-gray-800 flex-shrink-0"
                  />

                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2 font-mono">{item.name}</h4>
                    <p className="text-gray-400 mb-1 font-mono">₹{item.price}</p>
                    {item.size && (
                      <p className="text-sm text-gray-500 mb-2 font-mono">Size: {item.size}</p>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-0 rounded-lg overflow-hidden">
                        <button
                          className="bg-main-purple text-white border-none w-10 h-10 text-lg flex justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-purple-600 disabled:opacity-50"
                          onClick={() => updateQuantity(item.product, item.size, -1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease"
                        >-</button>
                        <span className="text-white text-lg font-bold min-w-12 text-center bg-gray-800 h-10 flex justify-center items-center border-t border-b border-gray-600">
                          {item.quantity}
                        </span>
                        <button
                          className="bg-main-purple text-white border-none w-10 h-10 text-lg flex justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-purple-600"
                          onClick={() => updateQuantity(item.product, item.size, 1)}
                          aria-label="Increase"
                        >+</button>
                      </div>

                      <button
                        className="bg-transparent text-red-400 border border-red-400 py-2 px-4 rounded cursor-pointer text-sm transition-all duration-200 hover:bg-red-400 hover:text-white font-mono"
                        onClick={() => removeFromCart(item.product, item.size)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-white font-mono">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6 font-mono">Order Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-300 font-mono">
                  <span>Subtotal ({groupedItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300 font-mono">
                  <span>Shipping</span>
                  <span className="text-green-400">FREE</span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-xl font-bold text-white font-mono">
                    <span>Total</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 font-mono mb-4 text-center">
                💡 For address + customization options, use the cart icon in the navbar.
              </p>

              <button
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white border-none rounded-2xl py-4 text-lg font-bold cursor-pointer hover:bg-green-500 transition-colors duration-200 font-mono tracking-wider"
                onClick={handleBuyOnWhatsApp}
              >
                <IoLogoWhatsapp size={22} />
                BUY ON WHATSAPP
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartPage;