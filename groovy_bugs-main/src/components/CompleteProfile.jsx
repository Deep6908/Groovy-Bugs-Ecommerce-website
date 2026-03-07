import React, { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { userAPI } from "../services/api";

// --- Constants (No changes here) ---
const ALL_CATEGORIES = ["Posters", "Tees", "Tote Bags", "Accessories"];
const GENDERS = [
    { label: "Select Gender", value: "" }, { label: "Male", value: "male" },
    { label: "Female", value: "female" }, { label: "Other", value: "other" },
    { label: "Prefer not to say", value: "prefer_not_to_say" }
];
const ADDRESS_TYPES = [
    { label: "Home", value: "home" }, { label: "Work", value: "work" },
    { label: "Other", value: "other" }
];

// --- The Improved Component ---
const CompleteProfile = ({ onClose }) => {
    const { user } = useUser();
    const navigate = useNavigate();

    // --- State Management ---
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [formData, setFormData] = useState({
        // Pre-fill user data from Clerk
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        gender: "",
        dateOfBirth: "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        preferences: {
            favoriteCategories: [],
            newsletter: true,
            smsUpdates: false,
            emailUpdates: true
        },
        address: {
            type: "home",
            fullName: user?.fullName || "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "India",
            phone: "",
            isDefault: true
        },
    });

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');

        setSubmitError(null);
        if (keys.length > 1) { // Nested state (preferences)
            setFormData(prev => ({
                ...prev,
                [keys[0]]: { ...prev[keys[0]], [keys[1]]: type === "checkbox" ? checked : value }
            }));
        } else { // Top-level state
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setSubmitError(null);
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [name]: value }
        }));
    };

    const handleCategoryToggle = (category) => {
        setSubmitError(null);
        const currentCategories = formData.preferences.favoriteCategories;
        const isSelected = currentCategories.includes(category);
        const newCategories = isSelected
            ? currentCategories.filter(c => c !== category)
            : [...currentCategories, category];
        
        setFormData(prev => ({
            ...prev,
            preferences: { ...prev.preferences, favoriteCategories: newCategories }
        }));
    };

    // --- Step Navigation & Submission ---
    const nextStep = () => {
        // Simple validation before proceeding
        if (currentStep === 1) {
            if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dateOfBirth) {
                toast.warn("Please fill in all personal details.", { position: "top-center", theme: "dark" });
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final validation check
        const { address } = formData;
        if (!address.fullName || !address.addressLine1 || !address.city || !address.state || !address.postalCode || !address.phone) {
            toast.warn("Please complete your shipping address.", { position: "top-center", theme: "dark" });
            return;
        }

        setLoading(true);
        setSubmitError(null);

        try {
            await userAPI.completeProfile({
                clerkId: user.id,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth,
                address: formData.address,
                preferences: formData.preferences
            });
            toast.success("Profile saved! Welcome to Groovy Bugs.", { position: "top-center", theme: "dark" });
            onClose();
            navigate("/"); // Or to a dashboard
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred.";
            setSubmitError(errorMessage);
            toast.error(errorMessage, { position: "top-center", theme: "dark" });
        } finally {
            setLoading(false);
        }
    };

    // --- Reusable Tailwind classes for consistent styling ---
    const inputClasses = "w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-purple focus:border-main-purple bg-gray-800 text-white placeholder-gray-500 font-mono text-sm transition-all duration-200";
    const labelClasses = "block text-sm text-purple-300 font-mono mb-2 uppercase tracking-wider";
    const buttonPrimaryClasses = "px-6 py-3 rounded-lg font-bold transition-all duration-300 ease-in-out text-base font-mono uppercase tracking-wider transform hover:scale-105 disabled:opacity-50 disabled:scale-100";
    const buttonSecondaryClasses = `${buttonPrimaryClasses} bg-gray-700 text-white hover:bg-gray-600`;

    // --- Component for Progress Indicator ---
    const ProgressIndicator = () => (
        <div className="flex justify-between items-center mb-8">
            {['Personal', 'Your Style', 'Shipping'].map((stepName, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${currentStep >= index + 1 ? 'bg-main-purple text-white' : 'bg-gray-700 text-gray-400'}`}>
                            {index + 1}
                        </div>
                        <p className={`mt-2 text-xs font-mono uppercase ${currentStep >= index + 1 ? 'text-purple-300' : 'text-gray-500'}`}>{stepName}</p>
                    </div>
                    {index < 2 && <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${currentStep > index + 1 ? 'bg-main-purple' : 'bg-gray-700'}`} />}
                </React.Fragment>
            ))}
        </div>
    );
    
    // --- Render Logic ---
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-gray-900/70 border border-purple-800/50 p-6 md:p-8 rounded-2xl shadow-2xl shadow-purple-900/20 w-full max-w-3xl text-white flex flex-col h-auto max-h-[95vh] overflow-y-auto custom-scrollbar">
                
                <ProgressIndicator />

                <h2 className="text-3xl font-black text-white mb-2 text-center font-mono uppercase">
                    {currentStep === 1 && "Personal Information"}
                    {currentStep === 2 && "Customize Your Style"}
                    {currentStep === 3 && "Default Shipping Details"}
                </h2>
                <p className="text-center text-gray-400 mb-6 font-mono text-sm">
                    {currentStep === 1 && "Let's get to know you."}
                    {currentStep === 2 && "Tell us what you love."}
                    {currentStep === 3 && "Where should we send your awesome stuff?"}
                </p>

                {submitError && (
                    <p className="text-red-400 text-sm mb-4 text-center font-mono animate-pulse">{submitError}</p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-grow">
                    {/* --- STEP 1: Personal Info --- */}
                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div><label className={labelClasses}>First Name</label><input name="firstName" type="text" value={formData.firstName} onChange={handleChange} required className={inputClasses} /></div>
                            <div><label className={labelClasses}>Last Name</label><input name="lastName" type="text" value={formData.lastName} onChange={handleChange} required className={inputClasses} /></div>
                            <div><label className={labelClasses}>Gender</label><select name="gender" value={formData.gender} onChange={handleChange} required className={inputClasses}>{GENDERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                            <div><label className={labelClasses}>Date of Birth</label><input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required className={inputClasses} /></div>
                            <div className="md:col-span-2"><label className={labelClasses}>Email</label><input name="email" type="email" value={formData.email} required className={`${inputClasses} bg-gray-900 cursor-not-allowed`} disabled /></div>
                        </div>
                    )}

                    {/* --- STEP 2: Preferences --- */}
                    {currentStep === 2 && (
                        <div>
                            <div>
                                <label className={labelClasses}>Favorite Categories</label>
                                <div className="flex flex-wrap gap-3">
                                    {ALL_CATEGORIES.map(cat => (
                                        <button type="button" key={cat} onClick={() => handleCategoryToggle(cat)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${formData.preferences.favoriteCategories.includes(cat) ? 'bg-main-purple text-white shadow-lg shadow-purple-900/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 border-t border-gray-700 pt-6">
                                <label className="flex items-center text-sm text-gray-300 font-mono"><input type="checkbox" name="preferences.newsletter" checked={formData.preferences.newsletter} onChange={handleChange} className="mr-2 h-4 w-4 text-main-purple rounded focus:ring-main-purple bg-gray-700 border-gray-600" />Newsletter</label>
                                <label className="flex items-center text-sm text-gray-300 font-mono"><input type="checkbox" name="preferences.smsUpdates" checked={formData.preferences.smsUpdates} onChange={handleChange} className="mr-2 h-4 w-4 text-main-purple rounded focus:ring-main-purple bg-gray-700 border-gray-600" />SMS Updates</label>
                                <label className="flex items-center text-sm text-gray-300 font-mono"><input type="checkbox" name="preferences.emailUpdates" checked={formData.preferences.emailUpdates} onChange={handleChange} className="mr-2 h-4 w-4 text-main-purple rounded focus:ring-main-purple bg-gray-700 border-gray-600" />Email Updates</label>
                            </div>
                        </div>
                    )}
                    
                    {/* --- STEP 3: Address --- */}
                    {currentStep === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div><label className={labelClasses}>Address Type</label><select name="type" value={formData.address.type} onChange={handleAddressChange} required className={inputClasses}>{ADDRESS_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                            <div><label className={labelClasses}>Full Name</label><input name="fullName" type="text" value={formData.address.fullName} onChange={handleAddressChange} required className={inputClasses} /></div>
                            <div className="md:col-span-2"><label className={labelClasses}>Address Line 1</label><input name="addressLine1" type="text" value={formData.address.addressLine1} onChange={handleAddressChange} required className={inputClasses} /></div>
                            <div className="md:col-span-2"><label className={labelClasses}>Address Line 2 (Optional)</label><input name="addressLine2" type="text" value={formData.address.addressLine2} onChange={handleAddressChange} className={inputClasses} /></div>
                            <div><label className={labelClasses}>City</label><input name="city" type="text" value={formData.address.city} onChange={handleAddressChange} required className={inputClasses} /></div>
                            <div><label className={labelClasses}>State</label><input name="state" type="text" value={formData.address.state} onChange={handleAddressChange} required className={inputClasses} /></div>
                            <div><label className={labelClasses}>Postal Code</label><input name="postalCode" type="text" value={formData.address.postalCode} onChange={handleAddressChange} required className={inputClasses} /></div>
                            <div><label className={labelClasses}>Country</label><input name="country" type="text" value={formData.address.country} onChange={handleAddressChange} required className={`${inputClasses} bg-gray-900 cursor-not-allowed`} disabled/></div>
                            <div className="md:col-span-2"><label className={labelClasses}>Phone</label><input name="phone" type="tel" value={formData.address.phone} onChange={handleAddressChange} required className={inputClasses} /></div>
                        </div>
                    )}

                    {/* --- Action Buttons --- */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-800 flex-shrink-0">
                        <div>
                            {currentStep > 1 && (
                                <button type="button" onClick={prevStep} className={buttonSecondaryClasses} disabled={loading}>Previous</button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className={buttonSecondaryClasses} disabled={loading}>Cancel</button>
                            {currentStep < 3 && (
                                <button type="button" onClick={nextStep} className={`${buttonPrimaryClasses} bg-main-purple text-white hover:bg-purple-700`} disabled={loading}>Next</button>
                            )}
                            {currentStep === 3 && (
                                <button type="submit" className={`${buttonPrimaryClasses} bg-green-500 text-white hover:bg-green-600`} disabled={loading}>
                                    {loading ? "Saving..." : "Save Profile"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfile;