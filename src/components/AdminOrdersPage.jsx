import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
    IoLogoWhatsapp, IoRefreshOutline, IoAlertCircle,
        IoSearchOutline, IoFilterOutline, IoCubeOutline, IoCartOutline
} from 'react-icons/io5';
import { productAPI } from '../services/api';

const STATUS_COLORS = {
    pending:   'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    confirmed: 'bg-blue-900/50 text-blue-300 border-blue-700',
    processing:'bg-purple-900/50 text-purple-300 border-purple-700',
    shipped:   'bg-indigo-900/50 text-indigo-300 border-indigo-700',
    delivered: 'bg-green-900/50 text-green-300 border-green-700',
    cancelled: 'bg-red-900/50 text-red-300 border-red-700',
    returned:  'bg-orange-900/50 text-orange-300 border-orange-700',
};

const StatusBadge = ({ status }) => (
    <span className={`inline-block text-xs font-bold font-mono uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
        {status}
    </span>
);

const WHATSAPP_TEMPLATES = {
    confirmed:  (ref) => `Hi! Your Groovy Bugs order ${ref} has been confirmed ✅ We'll pack it right away!`,
    shipped:    (ref) => `Hi! Your Groovy Bugs order ${ref} has been shipped 🚚 You'll receive it soon!`,
    delivered:  (ref) => `Hi! Your Groovy Bugs order ${ref} has been delivered 🎉 We hope you love it! Do give us a review.`,
    cancelled:  (ref) => `Hi! Unfortunately your Groovy Bugs order ${ref} has been cancelled ❌ Please reach out if you have questions.`,
};

const AdminOrdersPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]             = useState(1);
    const [updatingId, setUpdatingId] = useState(null);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });

    // Inventory state
    const [activeTab, setActiveTab]   = useState('orders'); // 'orders' or 'inventory'
    const [products, setProducts]     = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

    const ownerPhone = (import.meta.env.VITE_OWNER_WHATSAPP_NUMBER || '').replace(/\D/g, '');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await orderAPI.getAll?.({ page, limit: 20, status: statusFilter || undefined, search: search || undefined });
            setOrders(data?.orders || []);
            setPagination(data?.pagination || {});
        } catch (err) {
            toast.error('Failed to load orders.', { theme: 'dark' });
        } finally { setLoading(false); }
    }, [page, statusFilter, search]);

    const fetchProducts = useCallback(async () => {
        if (activeTab !== 'inventory') return;
        setProductsLoading(true);
        try {
            const data = await productAPI.getAllAdmin();
            setProducts(data || []);
        } catch (err) {
            toast.error('Failed to load products.', { theme: 'dark' });
        } finally { setProductsLoading(false); }
    }, [activeTab]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleStatusChange = async (orderId, newStatus, orderNumber, customerPhone) => {
        setUpdatingId(orderId);
        try {
            await orderAPI.updateStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
            toast.success(`Order ${orderNumber} → ${newStatus}`, { theme: 'dark' });

            // Open WhatsApp template for the customer if phone is stored
            const template = WHATSAPP_TEMPLATES[newStatus];
            if (template && customerPhone) {
                const phone = customerPhone.replace(/\D/g, '');
                if (phone.length >= 10) {
                    const msg = template(orderNumber);
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                }
            }
            toast.error('Failed to update status.', { theme: 'dark' });
        } finally { setUpdatingId(null); }
    };

    const handleStockToggle = async (productId) => {
        try {
            const res = await productAPI.toggleStock(productId);
            toast.success(res.message, { theme: 'dark' });
            setProducts(prev => prev.map(p => p._id === productId ? { ...p, inStock: res.inStock } : p));
        } catch (err) {
            toast.error('Failed to toggle stock.', { theme: 'dark' });
        }
    };

    const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchOrders(); };

    return (
        <section className="min-h-screen bg-main-bg py-20 px-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-wider">
                            {activeTab === 'orders' ? '📦 Orders Dashboard' : '📦 Products Inventory'}
                        </h1>
                        <p className="text-gray-400 text-sm font-mono mt-1">
                            {activeTab === 'orders' ? `${pagination.totalOrders || orders.length} total orders` : `${products.length} total products`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-mono flex items-center gap-2 transition-colors ${activeTab === 'orders' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                            <IoCartOutline size={16} /> Orders
                        </button>
                        <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-lg text-sm font-mono flex items-center gap-2 transition-colors ${activeTab === 'inventory' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                            <IoCubeOutline size={16} /> Inventory
                        </button>
                        <button onClick={activeTab === 'orders' ? fetchOrders : fetchProducts} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-mono flex items-center gap-2 ml-4">
                            <IoRefreshOutline size={16} /> Refresh
                        </button>
                    </div>
                </div>

                {activeTab === 'orders' && (
                    <>
                        {/* Filters */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <IoSearchOutline size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by ref, email, name..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white pl-9 pr-3 py-2 text-sm font-mono placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-mono font-bold">Search</button>
                    </form>
                    <div className="flex items-center gap-2">
                        <IoFilterOutline size={16} className="text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Status</option>
                            {['pending','confirmed','processing','shipped','delivered','cancelled','returned'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400 font-mono animate-pulse">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl">
                        <p className="text-gray-400 font-mono text-lg">No orders found.</p>
                    </div>
                ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm font-mono">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-950">
                                        {['Order Ref','Customer','Items','Source','Total','Status','Date','Actions'].map(h => (
                                            <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => {
                                        const customerPhone = order.shippingAddress?.phone || '';
                                        const customerName  = order.shippingAddress?.fullName || order.userEmail || '—';
                                        const itemSummary   = order.items?.slice(0, 2).map(i => `${i.name} ×${i.quantity}`).join(', ');
                                        const moreItems     = (order.items?.length || 0) > 2 ? ` +${order.items.length - 2} more` : '';
                                        return (
                                            <tr key={order._id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3 text-purple-400 font-bold whitespace-nowrap">{order.orderNumber}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-white font-bold truncate max-w-[140px]">{customerName}</p>
                                                    {customerPhone && <p className="text-gray-500 text-xs">{customerPhone}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-gray-300 max-w-[200px]">
                                                    <span className="truncate block">{itemSummary}{moreItems}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.source === 'whatsapp'
                                                        ? <span className="text-green-400 flex items-center gap-1"><IoLogoWhatsapp size={14}/> WA</span>
                                                        : <span className="text-blue-400">💳 Checkout</span>}
                                                </td>
                                                <td className="px-4 py-3 text-white font-bold whitespace-nowrap">₹{Number(order.totalAmount).toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={order.orderStatus}
                                                        disabled={updatingId === order._id}
                                                        onChange={e => handleStatusChange(order._id, e.target.value, order.orderNumber, customerPhone)}
                                                        className={`text-xs font-mono border rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50 ${STATUS_COLORS[order.orderStatus] || 'bg-gray-800 text-gray-300 border-gray-600'}`}
                                                    >
                                                        {['pending','confirmed','processing','shipped','delivered','cancelled','returned'].map(s => (
                                                            <option key={s} value={s} className="bg-gray-900 text-white">{s}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {customerPhone && (
                                                            <a
                                                                href={`https://wa.me/${customerPhone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi! Regarding your order ${order.orderNumber}:`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 bg-green-900/40 hover:bg-green-800 text-green-400 rounded-lg transition-colors"
                                                                title="Message customer on WhatsApp"
                                                            >
                                                                <IoLogoWhatsapp size={16} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {(pagination.totalPages > 1) && (
                            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                                <p className="text-xs text-gray-500 font-mono">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={!pagination.hasPrev} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg text-xs font-mono">← Prev</button>
                                    <button onClick={() => setPage(p => p+1)} disabled={!pagination.hasNext} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg text-xs font-mono">Next →</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                </>
                )}

                {activeTab === 'inventory' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mt-6">
                        {productsLoading ? (
                            <div className="text-center py-20 text-gray-400 font-mono animate-pulse">Loading inventory...</div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl">
                                <p className="text-gray-400 font-mono text-lg">No products found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm font-mono">
                                    <thead>
                                        <tr className="border-b border-gray-800 bg-gray-950">
                                            {['Product', 'Category', 'Price', 'Status', 'Date', 'Toggle Stock'].map(h => (
                                                <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(product => (
                                            <tr key={product._id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                                            <img src={product.image || "https://via.placeholder.com/40"} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="text-white font-bold truncate max-w-[200px]">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-300">{product.category}</td>
                                                <td className="px-4 py-3 text-white font-bold whitespace-nowrap">₹{Number(product.price).toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block text-xs font-bold font-mono uppercase px-2 py-0.5 rounded-full border ${product.inStock ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-red-900/50 text-red-300 border-red-700'}`}>
                                                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                                                    {new Date(product.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleStockToggle(product._id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${product.inStock ? 'bg-red-900/40 text-red-400 hover:bg-red-800' : 'bg-green-900/40 text-green-400 hover:bg-green-800'}`}
                                                    >
                                                        {product.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AdminOrdersPage;
