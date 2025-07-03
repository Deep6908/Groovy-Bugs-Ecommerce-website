import React from "react";

const CartPage = ({ cart, onRemoveFromCart }) => {
  const grouped = cart.reduce((acc, item) => {
    acc[item.id] = acc[item.id] || { ...item, quantity: 0 };
    acc[item.id].quantity++;
    return acc;
  }, {});
  const items = Object.values(grouped);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-groovy-dark">
      <div className="section pt-20 sm:pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-8 text-center uppercase tracking-wider">
            Your Cart
          </h1>
          
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white text-lg sm:text-xl">Your cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.id} className="bg-groovy-gray rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl bg-groovy-dark" 
                  />
                  <div className="flex-1 flex flex-col items-center sm:items-start gap-2">
                    <h3 className="text-white font-bold text-lg sm:text-xl mb-2">{item.name}</h3>
                    <p className="text-gray-300 text-base sm:text-lg">₹{item.price}</p>
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-center gap-2 bg-groovy-dark rounded-lg overflow-hidden w-fit mt-2">
                      <button
                        onClick={() => onRemoveFromCart(item.id, 'decrement')}
                        disabled={item.quantity <= 1}
                        className="bg-groovy-purple text-white w-8 h-8 flex items-center justify-center hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                      </button>
                      <span className="text-white font-bold px-3 py-2 min-w-[2rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => onRemoveFromCart(item.id, 'increment')}
                        className="bg-groovy-purple text-white w-8 h-8 flex items-center justify-center hover:bg-purple-600 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveFromCart(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200 mt-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <div className="bg-groovy-gray rounded-2xl p-4 sm:p-6 text-center">
                <div className="text-white font-bold text-xl sm:text-2xl">
                  Total: ₹{total}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;