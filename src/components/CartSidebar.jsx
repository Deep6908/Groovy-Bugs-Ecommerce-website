import React, { useState } from "react";
import { X, Minus, Plus } from "lucide-react";

const CartSidebar = ({
  isOpen,
  onClose,
  cart,
  onRemoveFromCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
}) => {
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // Group items by id
  const grouped = cart.reduce((acc, item) => {
    acc[item.id] = acc[item.id] || { ...item, quantity: 0 };
    acc[item.id].quantity++;
    return acc;
  }, {});

  const items = Object.values(grouped);

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Apply discount if valid
  const applyDiscount = () => {
    if (discountCode.toLowerCase() === "groovy20") {
      setAppliedDiscount({
        code: discountCode,
        percentage: 20,
        amount: subtotal * 0.2,
      });
    } else if (discountCode.toLowerCase() === "welcome10") {
      setAppliedDiscount({
        code: discountCode,
        percentage: 10,
        amount: subtotal * 0.1,
      });
    } else {
      alert("Invalid discount code");
      setAppliedDiscount(null);
    }
    setDiscountCode("");
  };

  // Calculate total after discount
  const total = appliedDiscount ? subtotal - appliedDiscount.amount : subtotal;

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "visible opacity-100" : "invisible opacity-0"
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Sidebar */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md sm:max-w-lg bg-groovy-dark shadow-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <div className="flex-1 flex justify-center">
            <h2 className="font-display text-xl sm:text-2xl  text-white uppercase tracking-wider text-center">
              Cart
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-groovy-purple transition-colors duration-200 ml-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-white text-lg">Your cart is empty.</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 p-4 sm:p-6 space-y-4 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border-b border-gray-700 last:border-b-0"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg bg-groovy-gray"
                  />
                  <div className="flex-1 space-y-2">
                    <h4 className="text-white font-medium text-sm sm:text-base">
                      {item.name}
                    </h4>
                    <p className="text-gray-300 text-sm">₹{item.price}</p>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-center sm:items-start gap-2 mt-2">
                      <div className="flex items-center justify-center gap-2 bg-groovy-dark rounded-lg overflow-hidden w-fit">
                        <button
                          onClick={() => onDecreaseQuantity(item.id)}
                          disabled={item.quantity <= 1}
                          className="bg-groovy-purple text-white w-8 h-8 flex items-center justify-center hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M20 12H4"
                            />
                          </svg>
                        </button>
                        <span className="text-white font-bold px-3 py-2 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onIncreaseQuantity(item.id)}
                          className="bg-groovy-purple text-white w-8 h-8 flex items-center justify-center hover:bg-purple-600 transition-colors duration-200"
                          aria-label="Increase quantity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200 mt-2"
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-700 space-y-4">
              {/* Special Instructions */}
              <div>
                {showInstructions ? (
                  <div className="space-y-3">
                    <textarea
                      placeholder="Add any special instructions/notes"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full h-20 bg-groovy-gray border border-gray-600 rounded-lg text-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-groovy-purple"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSpecialInstructions("");
                          setShowInstructions(false);
                        }}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowInstructions(false)}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowInstructions(true)}
                    className="text-groovy-purple hover:text-purple-400 text-sm transition-colors duration-200"
                  >
                    Add any special instructions/notes
                  </button>
                )}
              </div>

              {/* Discount Code */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Apply Discount Code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 bg-groovy-gray border border-gray-600 rounded-lg text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-groovy-purple"
                />
                <button
                  onClick={applyDiscount}
                  className="btn-primary text-sm py-3 px-4"
                >
                  Apply
                </button>
              </div>

              {/* Cart Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>INR {subtotal}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-groovy-pink">
                    <span>Discount ({appliedDiscount.percentage}%)</span>
                    <span>-INR {appliedDiscount.amount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-gray-600">
                  <span>Total</span>
                  <span>INR {total}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="btn-primary w-full py-3">CHECKOUT</button>
                <button onClick={onClose} className="btn-secondary w-full py-3">
                  Continue Shopping
                </button>
              </div>

              {/* Payment Info */}
              <p className="text-gray-400 text-xs text-center">
                Secure checkout powered by Razorpay
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
