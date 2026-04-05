import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const placeholderCropTops = [
  { name: "Classic Crop Top", price: 499, description: "Classic comfy crop top", category: "Crop Tops", image: "https://via.placeholder.com/400x500/1e1e1e/8a2be2?text=Classic+Crop", inStock: true, inventory: 10 },
  { name: "Ribbed Crop Top", price: 549, description: "Stylish ribbed crop top", category: "Crop Tops", image: "https://via.placeholder.com/400x500/1e1e1e/8a2be2?text=Ribbed+Crop", inStock: true, inventory: 10 },
  { name: "Graphic Crop Top", price: 599, description: "Vintage graphic crop top", category: "Crop Tops", image: "https://via.placeholder.com/400x500/1e1e1e/8a2be2?text=Graphic+Crop", inStock: true, inventory: 10 },
  { name: "Relaxed Crop Top", price: 649, description: "Relaxed fit crop top", category: "Crop Tops", image: "https://via.placeholder.com/400x500/1e1e1e/8a2be2?text=Relaxed+Crop", inStock: true, inventory: 10 },
];

const placeholderPouchBags = [
  { name: "Canvas Pouch", price: 499, description: "Durable canvas pouch", category: "Pouch Bags", image: "https://via.placeholder.com/400x500/1e1e1e/8a2be2?text=Canvas+Pouch", inStock: true, inventory: 10 },
  { name: "Travel Pouch", price: 599, description: "Handy travel pouch", category: "Pouch Bags", image: "https://via.placeholder.com/400x500/1e1e1e/8a2be2?text=Travel+Pouch", inStock: true, inventory: 10 },
  { name: "Utility Pouch", price: 549, description: "Utility pouch for everyday items", category: "Pouch Bags", image: "https://via.placeholder.com/400x500/1e1e1e/8a2be2?text=Utility+Pouch", inStock: true, inventory: 10 },
  { name: "Mini Zip Pouch", price: 449, description: "Compact mini zip pouch", category: "Pouch Bags", image: "https://via.placeholder.com/400x500/1e1e1e/8a2be2?text=Mini+Zip", inStock: true, inventory: 10 },
];

const placeholderAccessories = [
  { name: "Keychain", price: 299, description: "Groovy bugs keychain", category: "Accessories", image: "https://via.placeholder.com/400x400/1e1e1e/8a2be2?text=Keychain", inStock: true, inventory: 10 },
  { name: "Phone Charm", price: 399, description: "Cute phone charm", category: "Accessories", image: "https://via.placeholder.com/400x400/1e1e1e/8a2be2?text=Phone+Charm", inStock: true, inventory: 10 },
  { name: "Sticker Pack", price: 199, description: "Pack of 5 groovy stickers", category: "Accessories", image: "https://via.placeholder.com/400x400/1e1e1e/8a2be2?text=Stickers", inStock: true, inventory: 10 },
  { name: "Badge Set", price: 249, description: "Set of 3 pin badges", category: "Accessories", image: "https://via.placeholder.com/400x400/1e1e1e/8a2be2?text=Badges", inStock: true, inventory: 10 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  
  const all = [...placeholderCropTops, ...placeholderPouchBags, ...placeholderAccessories];
  for (const item of all) {
      const existing = await mongoose.connection.collection('products').findOne({ name: item.name });
      if (!existing) {
          await mongoose.connection.collection('products').insertOne({
              ...item,
              images: [],
              sizes: [],
              tags: [],
              createdAt: new Date(),
              updatedAt: new Date()
          });
          console.log("Created:", item.name);
      } else {
          console.log("Exists:", item.name);
      }
  }
  
  console.log("Done");
  process.exit(0);
}
seed();
