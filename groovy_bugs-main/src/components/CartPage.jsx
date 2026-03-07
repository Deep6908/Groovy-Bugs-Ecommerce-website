import React from "react";
import { Link } from "react-router-dom"; // Make sure Link is imported
import { useCart } from "../context/CartContext";

const CartPage = () => {
  const { getGroupedCart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const groupedItems = getGroupedCart();
  const total = getCartTotal();

  return (
    <section className="min-h-screen bg-main-bg py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-black text-white text-center mb-12 font-mono tracking-wider uppercase">
          Your Cart
        </h2>

        {groupedItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-400 mb-8 font-mono">Your cart is empty.</p>
            {/* Changed button to Link for navigation */}
            <Link
              to="/shop"
              className="inline-block bg-main-purple text-white border-none rounded-2xl py-3 px-8 text-lg font-bold cursor-pointer hover:bg-purple-600 transition-colors duration-200 font-mono tracking-wider no-underline"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Cart Items */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              {groupedItems.map((item, index) => (
                <div key={`${item._id || item.id}-${item.size || 'default'}`} className={`flex items-center gap-6 py-6 ${index !== groupedItems.length - 1 ? 'border-b border-gray-800' : ''}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg bg-gray-800 flex-shrink-0"
                  />

                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2 font-mono">{item.name}</h4>
                    <p className="text-gray-400 mb-2 font-mono">₹{item.price}</p>
                    {item.size && (
                      <p className="text-sm text-gray-500 mb-2 font-mono">Size: {item.size}</p>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-0 rounded-lg overflow-hidden">
                        <button
                          className="bg-main-purple text-white border-none w-10 h-10 text-lg flex justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-purple-600 disabled:opacity-50"
                          onClick={() => updateQuantity(item.items[0].cartId, -1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="text-white text-lg font-bold min-w-12 text-center bg-gray-800 h-10 flex justify-center items-center border-t border-b border-gray-600">
                          {item.quantity}
                        </span>
                        <button
                          className="bg-main-purple text-white border-none w-10 h-10 text-lg flex justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-purple-600"
                          onClick={() => updateQuantity(item.items[0].cartId, 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="bg-transparent text-red-400 border border-red-400 py-2 px-4 rounded cursor-pointer text-sm transition-all duration-200 hover:bg-red-400 hover:text-white font-mono"
                        onClick={() => removeFromCart(item.items[0].cartId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-white font-mono">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6 font-mono">Order Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-300 font-mono">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-gray-300 font-mono">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between text-gray-300 font-mono">
                  <span>Tax</span>
                  <span>₹0</span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-xl font-bold text-white font-mono">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-main-purple text-white border-none rounded-2xl py-4 text-lg font-bold cursor-pointer hover:bg-purple-600 transition-colors duration-200 font-mono tracking-wider">
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartPage;