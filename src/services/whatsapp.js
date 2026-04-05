/**
 * WhatsApp Order Message Builder — Groovy Bugs
 *
 * Bug 1 fix: Size "N/A" removed — size only shown when it has a real value.
 * Bug 2 fix: Shipping address included in message.
 * Bug 3 fix: Customization note included in message.
 * No discount code in message (discount system removed).
 */

const normalizePhone = (value) => (value || '').replace(/\D/g, '');

const getWhatsAppNumber = () =>
    normalizePhone(
        import.meta.env.VITE_OWNER_WHATSAPP_NUMBER ||
        import.meta.env.VITE_WHATSAPP_ORDER_NUMBER
    );

/**
 * validateShippingAddress — returns an array of error strings (empty = valid).
 * Used by CartSidebar before allowing the WhatsApp button.
 *
 * @param {Object} address
 * @returns {string[]}
 */
export const validateShippingAddress = (address) => {
    const errors = [];
    if (!address?.fullName?.trim())     errors.push('Full name is required');
    if (!address?.addressLine1?.trim()) errors.push('Address line 1 is required');
    if (!address?.city?.trim())         errors.push('City is required');
    if (!address?.state?.trim())        errors.push('State is required');
    if (!address?.postalCode?.trim())   errors.push('Pincode is required');

    const phone = (address?.phone || '').replace(/\D/g, '');
    if (!phone)              errors.push('Phone number is required');
    else if (phone.length !== 10) errors.push('Phone number must be exactly 10 digits');

    return errors;
};

/**
 * dedupeParts — returns an array where each part is unique compared to others.
 * Useful if the user types 'Noida' into the address line manually.
 */
const dedupeParts = (parts) => {
    const result = [];
    parts.forEach(part => {
        if (!part) return;
        const cleanPart = String(part).trim();
        if (!cleanPart) return;
        
        // Check if this part (e.g. 'Noida') is already contained in the previous string
        const combinedSoFar = result.join(', ').toLowerCase();
        if (combinedSoFar.includes(cleanPart.toLowerCase())) return;
        
        result.push(cleanPart);
    });
    return result;
};

/**
 * buildWhatsAppOrderUrl — builds the full wa.me deep-link.
 */
export const buildWhatsAppOrderUrl = ({
    items      = [],
    subtotal   = 0,
    address    = null,
    customNote = '',
    orderRef   = '',
}) => {
    if (!items.length) return '';

    const phoneNumber = getWhatsAppNumber();
    if (!phoneNumber) return '';

    const itemLines = items.map((item, i) => {
        const sizePart  = item.size ? ` | Size: ${item.size}` : '';
        const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
        return `${i + 1}. ${item.name}${sizePart} | Qty: ${item.quantity} | ₹${itemTotal}`;
    });

    const lines = [
        "Hi Groovy Bugs! I'd like to place an order:",
        '',
    ];

    if (orderRef) {
        lines.push(`Order Ref: ${orderRef}`, '');
    }

    lines.push('Items:');
    lines.push(...itemLines);
    lines.push('');
    lines.push(`Total: ₹${Number(subtotal).toFixed(2)}`);
    lines.push('');

    if (address?.fullName) {
        lines.push('Shipping Address:');
        lines.push(address.fullName);

        // Deduplicate address parts to prevent "Noida, Uttar Pradesh, Noida, Uttar Pradesh"
        const addrParts = dedupeParts([
            address.addressLine1,
            address.addressLine2,
            address.city,
            address.state
        ]);

        // Add pincode with state if possible
        let addressStr = addrParts.join(', ');
        if (address.postalCode) {
            addressStr += ` - ${address.postalCode}`;
        }

        lines.push(addressStr);
        if (address.phone) lines.push(`Phone: ${address.phone}`);
        lines.push('');
    }

    if (customNote?.trim()) {
        lines.push(`Customization Note: ${customNote.trim()}`);
        lines.push('');
    }

    lines.push('Please confirm my order. Thank you!');

    const message = lines.join('\n');
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};
