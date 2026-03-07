import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const products = [
  {
    name: "Led-Zeppelin Poster",
    category: "Posters",
    price: 75,
    image: "/images/led-zeppelin-poster.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    featured: true,
    inStock: true,
    inventory: 50,
    tags: ["music", "rock", "vintage", "led-zeppelin"]
  },
  {
    name: "The Beatles Poster",
    category: "Posters",
    price: 75,
    image: "/images/Beatles-poster.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    featured: true,
    inStock: true,
    inventory: 45,
    tags: ["music", "rock", "vintage", "beatles"]
  },
  {
    name: "Hozier Poster",
    category: "Posters",
    price: 75,
    image: "/images/Hozier-poster.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    featured: true,
    inStock: true,
    inventory: 30,
    tags: ["music", "indie", "hozier"]
  },
  {
    name: "Bon Jovi Tote Bag",
    category: "Tote Bags",
    price: 399,
    image: "/images/Bon-Jovi-Tote_Bag.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    featured: true,
    inStock: true,
    inventory: 25,
    tags: ["music", "rock", "bag", "bon-jovi"]
  },
  {
    name: "Fight Club Tote Bag",
    category: "Tote Bags",
    price: 399,
    image: "/images/fight-club-bag.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    featured: true,
    inStock: true,
    inventory: 20,
    tags: ["movie", "cult", "bag", "fight-club"]
  },
  {
    name: "Surreal art #1 Poster",
    category: "Posters",
    price: 75,
    image: "/images/bengali-psychedelic-poster.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    featured: true,
    inStock: true,
    inventory: 35,
    tags: ["art", "surreal", "psychedelic", "bengali"]
  },
  {
    name: "Have a cup of coffee Tote bag",
    category: "Tote Bags",
    price: 370,
    image: "/images/coffee-tote-bag.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    featured: true,
    inStock: true,
    inventory: 40,
    tags: ["coffee", "lifestyle", "bag"]
  },
  {
    name: "Haal-e-dil-Tee",
    category: "Tees",
    price: 500,
    image: "/images/tees/Haal-e-dil-tee.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    featured: true,
    inStock: true,
    inventory: 30,
    tags: ["urdu", "poetry", "tshirt"],
    sizes: [
      { size: "S", price: 500, inventory: 10 },
      { size: "M", price: 500, inventory: 10 },
      { size: "L", price: 500, inventory: 7 },
      { size: "XL", price: 500, inventory: 3 }
    ]
  },
  {
    name: "Fleabag Tote Bag",
    category: "Tote Bags",
    price: 399,
    image: "/images/fleabag-tote-bag.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 15,
    tags: ["tv-show", "comedy", "bag", "fleabag"]
  },
  {
    name: "Surreal art #1 Tote Bag",
    category: "Tote Bags",
    price: 399,
    image: "/images/surreal_art1_tote-bag.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 22,
    tags: ["art", "surreal", "bag"]
  },
  {
    name: "Jibanananda Das Tote Bag",
    category: "Tote Bags",
    price: 399,
    image: "/images/jibanananda-tote-bag.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 18,
    tags: ["poetry", "bengali", "literature", "bag"]
  },
  {
    name: "Haal E Dil Tote Bag",
    category: "Tote Bags",
    price: 399,
    image: "/images/Haal-e-dil-tote-bag.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 25,
    tags: ["urdu", "poetry", "bag"]
  },
  {
    name: "Arctic Monkeys Tee",
    category: "Tees",
    price: 500,
    image: "/images/tees/arctic-monkeys-tee.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 28,
    tags: ["music", "indie", "rock", "tshirt", "arctic-monkeys"],
    sizes: [
      { size: "S", price: 500, inventory: 8 },
      { size: "M", price: 500, inventory: 10 },
      { size: "L", price: 500, inventory: 7 },
      { size: "XL", price: 500, inventory: 3 }
    ]
  },
  {
    name: "Bon Jovi Tee",
    category: "Tees",
    price: 500,
    image: "/images/tees/bon-jovi-tee.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 32,
    tags: ["music", "rock", "tshirt", "bon-jovi"],
    sizes: [
      { size: "S", price: 500, inventory: 8 },
      { size: "M", price: 500, inventory: 12 },
      { size: "L", price: 500, inventory: 8 },
      { size: "XL", price: 500, inventory: 4 }
    ]
  },
  {
    name: "Led Zeppelin Tee",
    category: "Tees",
    price: 500,
    image: "/images/tees/led-zeppelin-tee.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 35,
    tags: ["music", "rock", "tshirt", "led-zeppelin"],
    sizes: [
      { size: "S", price: 500, inventory: 10 },
      { size: "M", price: 500, inventory: 12 },
      { size: "L", price: 500, inventory: 9 },
      { size: "XL", price: 500, inventory: 4 }
    ]
  },
  {
    name: "Surreal art #1 Tee",
    category: "Tees",
    price: 500,
    image: "/images/tees/surreal-art1-tee.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 20,
    tags: ["art", "surreal", "tshirt"],
    sizes: [
      { size: "S", price: 500, inventory: 5 },
      { size: "M", price: 500, inventory: 7 },
      { size: "L", price: 500, inventory: 5 },
      { size: "XL", price: 500, inventory: 3 }
    ]
  },
  {
    name: "Durga #1 Tee",
    category: "Tees",
    price: 500,
    image: "/images/tees/durga1-tee.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 25,
    tags: ["spiritual", "hindu", "goddess", "tshirt"],
    sizes: [
      { size: "S", price: 500, inventory: 6 },
      { size: "M", price: 500, inventory: 8 },
      { size: "L", price: 500, inventory: 7 },
      { size: "XL", price: 500, inventory: 4 }
    ]
  },
  {
    name: "Durga #2 Tee",
    category: "Tees",
    price: 500,
    image: "/images/tees/durga2-tee.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 22,
    tags: ["spiritual", "hindu", "goddess", "tshirt"],
    sizes: [
      { size: "S", price: 500, inventory: 5 },
      { size: "M", price: 500, inventory: 7 },
      { size: "L", price: 500, inventory: 6 },
      { size: "XL", price: 500, inventory: 4 }
    ]
  },
  {
    name: "Durga #3 Tee",
    category: "Tees",
    price: 500,
    image: "/images/tees/durga3-tee.jpg",
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    inStock: true,
    inventory: 18,
    tags: ["spiritual", "hindu", "goddess", "tshirt"],
    sizes: [
      { size: "S", price: 500, inventory: 4 },
      { size: "M", price: 500, inventory: 6 },
      { size: "L", price: 500, inventory: 5 },
      { size: "XL", price: 500, inventory: 3 }
    ]
  }
];

const extraPosters = [
  {
    name: "Bon Jovi Poster",
    image: "/images/bon-jovi-poster.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 40,
    tags: ["music", "rock", "bon-jovi"]
  },
  {
    name: "Queen Poster",
    image: "/images/queen-poster.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 35,
    tags: ["music", "rock", "queen"]
  },
  {
    name: "Arctic Monkeys Poster",
    image: "/images/arctic-monkeys-poster.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 30,
    tags: ["music", "indie", "rock", "arctic-monkeys"]
  },
  {
    name: "Jim Morrison",
    image: "/images/jim-morrison-poster.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 25,
    tags: ["music", "rock", "doors", "jim-morrison"]
  },
  {
    name: "Olivia Rodrigo Poster",
    image: "/images/olivia-rodrigo-poster.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 20,
    tags: ["music", "pop", "olivia-rodrigo"]
  },
  {
    name: "Jibanananda Das Poster",
    image: "/images/milky-way.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 15,
    tags: ["poetry", "bengali", "literature"]
  },
  {
    name: "All too well Poster",
    image: "/images/all-too-well.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 25,
    tags: ["music", "pop", "taylor-swift"]
  },
  {
    name: "Sokatore Oi Poster",
    image: "/images/hand-butterfly.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 20,
    tags: ["bengali", "art", "butterfly"]
  },
  {
    name: "Rockstar Poster",
    image: "/images/kagare-kagare.jpg",
    price: 75,
    description: "Order via Instagram DM or reach out to us on our email for Customs.",
    category: "Posters",
    inStock: true,
    inventory: 18,
    tags: ["music", "rockstar", "bengali"]
  }
];

const allProducts = [...products, ...extraPosters];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nilasishhalderofficial:Nilasish-2004@cluster0.tpwwczl.mongodb.net/');
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const insertedProducts = await Product.insertMany(allProducts);
    console.log(`Inserted ${insertedProducts.length} products`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();