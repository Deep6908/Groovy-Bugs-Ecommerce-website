import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { IoCopyOutline, IoCheckmarkCircle, IoLogoWhatsapp, IoStorefront } from 'react-icons/io5';
import { toast } from 'react-toastify';

const OrderConfirmationPage = () => {
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();
    const orderRef = searchParams.get('ref') || '';

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await orderAPI.getById(orderId);
                setOrder(data.order);
            } catch (err) {
                // For guest users the order may not be fetchable (no auth)
                // We still show the confirmation using query-param ref
                console.warn('Could not fetch order details:', err.message);
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId]);

    const handleCopyRef = () => {
        const refToCopy = order?.orderNumber || orderRef;
        navigator.clipboard.writeText(refToCopy).then(() => {
            setCopied(true);
            toast.success('Order reference copied!', { theme: 'dark' });
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const displayRef = order?.orderNumber || orderRef;
    const items      = order?.items || [];
    const total      = order?.totalAmount ?? null;
    const address    = order?.shippingAddress || null;

    return (
        <section className="min-h-screen bg-main-bg py-20 px-4">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* ── Success banner ── */}
                <div className="bg-green-900/20 border border-green-700 rounded-2xl p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-green-800/40 flex items-center justify-center">
                            <IoCheckmarkCircle className="text-green-400" size={40} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-white font-mono uppercase tracking-wider mb-2">
                        Order Sent! 🎉
                    </h1>
                    <p className="text-gray-300 text-sm font-mono">
                        Your order has been sent to <span className="text-green-400 font-bold">Groovy Bugs</span> on WhatsApp.
                        <br />We'll confirm your order within <span className="text-white font-bold">24 hours</span>.
                    </p>
                </div>

                {/* ── Order Reference ── */}
                {displayRef && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-2">Order Reference</p>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-2xl font-black text-purple-400 font-mono tracking-wider">
                                {displayRef}
                            </span>
                            <button
                                onClick={handleCopyRef}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-mono transition-all"
                                aria-label="Copy order reference"
                            >
                                {copied ? <IoCheckmarkCircle size={16} className="text-green-400" /> : <IoCopyOutline size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-3">
                            💡 Save this reference. You can share it on WhatsApp if you need to follow up.
                        </p>
                    </div>
                )}

                {/* ── Order Items ── */}
                {loading ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                        <div className="text-gray-500 font-mono text-sm animate-pulse">Loading order details...</div>
                    </div>
                ) : items.length > 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white font-mono mb-4">🧾 Order Summary</h2>
                        <div className="space-y-3">
                            {items.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
                                    {item.image && (
                                        <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg bg-gray-800 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-bold font-mono">{item.name}</p>
                                        {item.size && <p className="text-gray-400 text-xs">Size: {item.size}</p>}
                                        <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-white font-bold font-mono text-sm flex-shrink-0">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}

                            {total !== null && (
                                <div className="flex justify-between text-base font-black text-white font-mono pt-2">
                                    <span>Total Paid</span>
                                    <span className="text-green-400">₹{Number(total).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* ── Shipping Address ── */}
                {address && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white font-mono mb-3">📦 Shipping To</h2>
                        <div className="text-sm text-gray-300 font-mono space-y-0.5">
                            <p className="text-white font-bold">{address.fullName}</p>
                            <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                            <p>{address.city}, {address.state} - {address.postalCode}</p>
                            {address.phone && <p className="text-purple-400">📞 {address.phone}</p>}
                        </div>
                    </div>
                )}

                {/* ── What's next ── */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white font-mono mb-4">📋 What happens next?</h2>
                    <ol className="space-y-3 text-sm text-gray-300 font-mono">
                        {[
                            ['💬', 'Groovy Bugs receives your WhatsApp message'],
                            ['✅', 'They confirm your order within 24 hours'],
                            ['📦', 'Your items are packed with love'],
                            ['🚚', 'Shipped to your address'],
                            ['🎉', 'You receive your goodies!'],
                        ].map(([emoji, text], i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="text-lg flex-shrink-0">{emoji}</span>
                                <span className="leading-relaxed">{text}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* ── Actions ── */}
                <div className="flex flex-col sm:flex-row gap-3 pb-8">
                    <Link
                        to="/shop"
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl py-4 text-base font-bold font-mono tracking-wider transition-colors no-underline"
                    >
                        <IoStorefront size={20} />
                        Continue Shopping
                    </Link>
                    <a
                        href={`https://wa.me/${(import.meta.env.VITE_OWNER_WHATSAPP_NUMBER || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white rounded-xl py-4 text-base font-bold font-mono tracking-wider transition-colors no-underline"
                    >
                        <IoLogoWhatsapp size={20} />
                        Message Us
                    </a>
                </div>
            </div>
        </section>
    );
};

export default OrderConfirmationPage;
