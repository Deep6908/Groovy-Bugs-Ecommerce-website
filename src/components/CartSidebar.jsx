import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { orderAPI } from '../services/api';
import { buildWhatsAppOrderUrl, validateShippingAddress } from '../services/whatsapp';
import {
    IoClose, IoTrashOutline, IoBookOutline, IoLocationOutline,
    IoAlertCircle, IoLogoWhatsapp, IoInformationCircleOutline
} from 'react-icons/io5';

/* ─── Styling constants ───────────────────────────────────────────────── */
const inputCls = 'w-full bg-gray-800 border-2 border-gray-700 rounded-lg text-white p-2.5 text-sm font-mono placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-900/50 focus:outline-none transition-colors';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider';
const cardCls  = 'bg-gray-900/60 border border-gray-800 rounded-xl p-4';

const CartSidebar = ({ isOpen, onClose }) => {
    const { userId, isSignedIn } = useAuth();
    const { user } = useUser();
    const navigate   = useNavigate();

    const { removeFromCart, updateQuantity, getGroupedCart, getCartTotal, clearCart } = useCart();

    const groupedItems = getGroupedCart();
    const subtotal     = groupedItems.reduce((s, i) => s + i.price * i.quantity, 0);

    /* ── Customization note ── */
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [showNoteInput, setShowNoteInput]             = useState(false);

    /* ── Shipping address ── */
    const [address, setAddress] = useState({
        fullName: '', addressLine1: '', addressLine2: '',
        city: '', state: '', postalCode: '', phone: ''
    });
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);

    const addressComplete = !!(
        address.fullName?.trim() &&
        address.addressLine1?.trim() &&
        address.city?.trim() &&
        address.state?.trim() &&
        address.postalCode?.trim() &&
        address.phone?.replace(/\D/g, '').length === 10
    );

    const [isCheckingOut, setIsCheckingOut] = useState(false);

    /* ── Handlers ── */
    const handleAddressChange = e =>
        setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSaveAddress = e => {
        e.preventDefault();
        const errors = validateShippingAddress(address);
        if (errors.length) { errors.forEach(msg => toast.error(msg, { theme: 'dark' })); return; }
        toast.success('Address saved!', { theme: 'dark' });
        setShowAddressForm(false);
        setValidationErrors([]);
    };

    /* ── BUY ON WHATSAPP ── */
    const handleBuyOnWhatsApp = async () => {
        setValidationErrors([]);

        if (groupedItems.length === 0) {
            toast.error('Your cart is empty.', { theme: 'dark' }); return;
        }

        const addrErrors = validateShippingAddress(address);
        if (addrErrors.length) {
            setValidationErrors(addrErrors);
            setShowAddressForm(true);
            toast.error('Please complete your shipping address first.', { theme: 'dark' });
            return;
        }

        // Build WhatsApp URL FIRST — so we have it ready for the fallback
        const whatsappUrl = buildWhatsAppOrderUrl({
            items: groupedItems,
            subtotal,
            address,
            customNote: specialInstructions,
            orderRef: '', // will be replaced if DB save succeeds
        });

        if (!whatsappUrl) {
            toast.error('VITE_OWNER_WHATSAPP_NUMBER is not set in .env', { theme: 'dark' }); return;
        }

        setIsCheckingOut(true);

        // Step 1: Try to save order to MongoDB
        let orderNumber = '';
        let orderId     = '';
        try {
            const orderPayload = {
                items: groupedItems.map(i => ({
                    productId: i.product || null,
                    name:      i.name,
                    image:     i.image  || '',
                    size:      i.size   || null,
                    quantity:  i.quantity,
                    price:     i.price,
                })),
                shippingAddress: {
                    fullName:     address.fullName,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2 || '',
                    city:         address.city,
                    state:        address.state,
                    postalCode:   address.postalCode,
                    country:      'India',
                    phone:        address.phone,
                },
                subtotal,
                customizationNote: specialInstructions || null,
                userId:    userId    || null,
                userEmail: user?.primaryEmailAddress?.emailAddress || null,
            };

            const result = await orderAPI.createWhatsApp(orderPayload);
            orderNumber = result.orderNumber || '';
            orderId     = result.orderId     || '';
        } catch (err) {
            // ⚠️ FALLBACK: order save failed — log silently, DO NOT block WhatsApp
            const detail = err?.response?.data?.details?.join(', ')
                        || err?.response?.data?.error
                        || err?.response?.data?.message
                        || err.message;
            console.error('Order save failed (WhatsApp will still open):', detail, err);
            // Do not show a toast — just proceed to WhatsApp
        }

        // Step 2: Build the final URL (with orderRef if we got one)
        const finalUrl = buildWhatsAppOrderUrl({
            items: groupedItems,
            subtotal,
            address,
            customNote: specialInstructions,
            orderRef: orderNumber,
        });

        // Step 3: Open WhatsApp — ALWAYS, even if DB save failed
        window.open(finalUrl, '_blank', 'noopener,noreferrer');

        // Step 4: Clear cart and navigate to confirmation (only if order was saved)
        try { await clearCart(); } catch (_) {}
        onClose();

        if (orderId) {
            navigate(`/order-confirmation/${orderId}?ref=${orderNumber}`);
        } else {
            navigate(`/order-confirmation/guest?ref=${orderNumber || 'pending'}`);
        }

        setIsCheckingOut(false);
    };

    return (
        <div
            className={`fixed inset-0 bg-black/70 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg h-screen bg-[#121018] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-800 flex-shrink-0">
                    <h2 className="text-2xl font-black text-white font-mono uppercase">Your Cart</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Close cart">
                        <IoClose size={28} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {groupedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-full gap-4">
                            <div className="text-6xl">🛒</div>
                            <h3 className="text-xl font-bold text-white font-mono">Cart's empty!</h3>
                            <p className="text-gray-400 text-sm">Add some items and come back.</p>
                            <Link to="/shop" onClick={onClose} className="mt-2 bg-purple-700 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-mono font-bold no-underline">
                                Shop Now
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* ── Cart Items ── */}
                            <div className={cardCls}>
                                {groupedItems.map(item => (
                                    <div key={`${item.product}-${item.size || 'one-size'}`} className="flex gap-4 py-4 border-b border-gray-800 last:border-0">
                                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-gray-800" />
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <p className="text-white text-sm font-bold font-mono leading-tight">{item.name}</p>
                                                    {item.size && <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>}
                                                    <p className="text-purple-400 text-xs mt-0.5">₹{item.price} each</p>
                                                </div>
                                                <p className="text-white font-bold font-mono text-sm flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center rounded-lg overflow-hidden border border-gray-700">
                                                    <button
                                                        onClick={() => updateQuantity(item.product, item.size, -1)}
                                                        className="bg-gray-800 hover:bg-purple-800 text-white w-8 h-8 flex items-center justify-center text-lg transition-colors"
                                                        aria-label="Decrease quantity"
                                                    >-</button>
                                                    <span className="text-white font-bold min-w-[32px] text-center bg-gray-900 h-8 flex items-center justify-center text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product, item.size, 1)}
                                                        className="bg-gray-800 hover:bg-purple-800 text-white w-8 h-8 flex items-center justify-center text-lg transition-colors"
                                                        aria-label="Increase quantity"
                                                    >+</button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.product, item.size)}
                                                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                                    aria-label="Remove item"
                                                >
                                                    <IoTrashOutline size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Customization Note ── */}
                            <div className={cardCls}>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                                        <IoBookOutline size={16} /> Note / Customization
                                    </h3>
                                    {specialInstructions && !showNoteInput && (
                                        <button onClick={() => setShowNoteInput(true)} className="text-xs text-purple-400 hover:underline">Edit</button>
                                    )}
                                </div>
                                {showNoteInput ? (
                                    <div className="space-y-2">
                                        <textarea
                                            placeholder="e.g. Please gift-wrap this order 🎁"
                                            value={specialInstructions}
                                            onChange={e => setSpecialInstructions(e.target.value)}
                                            className={`${inputCls} h-20 resize-none`}
                                            maxLength={500}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowNoteInput(false)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-mono">Done</button>
                                        </div>
                                    </div>
                                ) : specialInstructions ? (
                                    <p className="text-gray-300 text-sm bg-gray-800 rounded-lg p-3 mt-1">{specialInstructions}</p>
                                ) : (
                                    <button onClick={() => setShowNoteInput(true)} className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 font-mono transition-colors">
                                        + Add a note
                                    </button>
                                )}
                            </div>

                            {/* ── Shipping Address ── */}
                            <div className={cardCls}>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                                        <IoLocationOutline size={16} /> Shipping Address
                                        {!addressComplete && (
                                            <span className="text-red-400 text-xs font-normal">*Required</span>
                                        )}
                                    </h3>
                                    {addressComplete && !showAddressForm && (
                                        <button onClick={() => setShowAddressForm(true)} className="text-xs text-purple-400 hover:underline">Edit</button>
                                    )}
                                </div>

                                {/* Inline validation errors */}
                                {validationErrors.length > 0 && (
                                    <div className="mb-3 p-3 bg-red-900/20 border border-red-800 rounded-lg space-y-1">
                                        {validationErrors.map((err, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-red-400 text-xs font-mono">
                                                <IoAlertCircle size={14} />{err}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(showAddressForm || !addressComplete) ? (
                                    <form onSubmit={handleSaveAddress} className="space-y-3 mt-2">
                                        <div>
                                            <label className={labelCls}>Full Name *</label>
                                            <input name="fullName" value={address.fullName} onChange={handleAddressChange} className={inputCls} placeholder="Rohit Sharma" required />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Address Line 1 *</label>
                                            <input name="addressLine1" value={address.addressLine1} onChange={handleAddressChange} className={inputCls} placeholder="House No, Street" required />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Address Line 2 (optional)</label>
                                            <input name="addressLine2" value={address.addressLine2} onChange={handleAddressChange} className={inputCls} placeholder="Landmark, Area" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>City *</label>
                                                <input name="city" value={address.city} onChange={handleAddressChange} className={inputCls} placeholder="Mumbai" required />
                                            </div>
                                            <div>
                                                <label className={labelCls}>State *</label>
                                                <input name="state" value={address.state} onChange={handleAddressChange} className={inputCls} placeholder="Maharashtra" required />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>Pincode *</label>
                                                <input name="postalCode" value={address.postalCode} onChange={handleAddressChange} className={inputCls} placeholder="400001" maxLength={6} required />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Phone * (10 digits)</label>
                                                <input name="phone" value={address.phone} onChange={handleAddressChange} className={inputCls} placeholder="9876543210" maxLength={10} required />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            {addressComplete && (
                                                <button type="button" onClick={() => { setShowAddressForm(false); setValidationErrors([]); }} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-mono">Cancel</button>
                                            )}
                                            <button type="submit" className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-mono font-bold">Save Address</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="text-sm text-gray-300 bg-gray-800 rounded-lg p-3 mt-1 space-y-0.5">
                                        <p className="font-bold text-white">{address.fullName}</p>
                                        <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                                        <p>{address.city}, {address.state} - {address.postalCode}</p>
                                        <p className="text-purple-400">📞 {address.phone}</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Order Summary (no discount line) ── */}
                            <div className={`${cardCls} space-y-2`}>
                                <div className="flex justify-between text-sm text-gray-400 font-mono">
                                    <span>Subtotal ({groupedItems.reduce((s, i) => s + i.quantity, 0)} {groupedItems.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'})</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-400 font-mono">
                                    <span>Shipping</span>
                                    <span className="text-green-400 font-bold">FREE</span>
                                </div>
                                <div className="border-t border-gray-700 pt-2 flex justify-between text-base font-bold text-white font-mono">
                                    <span>Total</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* ── CTAs ── */}
                            <div className="space-y-3 pb-4">
                                {/* Primary: BUY ON WHATSAPP */}
                                <button
                                    id="buy-whatsapp-btn"
                                    onClick={handleBuyOnWhatsApp}
                                    disabled={isCheckingOut}
                                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:bg-green-900 disabled:cursor-not-allowed text-white rounded-xl py-4 text-base font-bold font-mono tracking-wider transition-all duration-150"
                                >
                                    <IoLogoWhatsapp size={22} />
                                    {isCheckingOut ? 'OPENING WHATSAPP...' : 'BUY ON WHATSAPP'}
                                </button>

                                {/* Secondary: Coming Soon tooltip */}
                                <div className="relative group">
                                    <button
                                        disabled
                                        aria-label="Online checkout coming soon"
                                        className="w-full flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 text-gray-500 rounded-xl py-4 text-sm font-bold font-mono tracking-wider cursor-not-allowed"
                                    >
                                        <IoInformationCircleOutline size={18} />
                                        ONLINE CHECKOUT — COMING SOON 🚀
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-purple-800 text-gray-300 text-xs font-mono rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-xl">
                                        We're building a full checkout experience. For now, order via WhatsApp above! 🛍️
                                    </div>
                                </div>

                                <Link
                                    to="/shop"
                                    onClick={onClose}
                                    className="block w-full text-center text-purple-400 border border-purple-800 hover:bg-purple-900/30 rounded-xl py-3 text-sm font-mono transition-colors no-underline"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartSidebar;