const normalizePhoneNumber = (value) => (value || "").replace(/\D/g, "");

const getWhatsAppNumber = () => {
  const configuredNumber = normalizePhoneNumber(import.meta.env.VITE_WHATSAPP_ORDER_NUMBER);
  return configuredNumber;
};

export const buildWhatsAppOrderUrl = ({ items = [], total = 0 }) => {
  if (!items.length) {
    return "";
  }

  const phoneNumber = getWhatsAppNumber();
  if (!phoneNumber) {
    return "";
  }

  const itemLines = items.map((item, index) => {
    const sizeLabel = item.size ? item.size : "N/A";
    const quantity = item.quantity || 1;
    return `${index + 1}. ${item.name} | Size: ${sizeLabel} | Qty: ${quantity}`;
  });

  const message = [
    "Hi Groovy Bugs, I want to place an order:",
    "",
    ...itemLines,
    "",
    `Total: Rs. ${Number(total || 0).toFixed(2)}`,
  ].join("\n");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};
