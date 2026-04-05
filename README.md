# Groovy Bugs E-Commerce

Groovy Bugs is an open-source, full-stack e-commerce web application for selling custom accessories like posters, tees, tote bags, and more. 

Built with the MERN stack (React, Node.js, Express, MongoDB) enhanced by Vite, TailwindCSS, and Clerk for authentication.

## 🚀 Features

- **Full Catalog & Cart:** Browsing products by category, detailed product pages, responsive shopping cart
- **Authentication:** Secure user authentication via Clerk
- **Admin Roles:** Role-based access control protecting products, orders, and user management routes
- **Checkout:** Order creation with dynamic pricing (e.g., Tees vs Oversized Tees)
- **Security:** Modern robust backend with JWT auth and Mongoose schemas

## 📚 Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router DOM
- Clerk Authentication
- Axios

### Backend
- Node.js
- Express.js
- MongoDB / Mongoose
- JSON Web Tokens (JWT)

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI
- A free [Clerk account](https://clerk.com/) for authentication

### 1. Clone & Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Configure Environment Variables

Create `.env` files in both the root and `backend` directories using the provided examples.

**Frontend (`/.env`)**
```env
# Create .env based on .env.example
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:4000
```

**Backend (`/backend/.env`)**
```env
# Create backend/.env based on backend/.env.example
PORT=4000
MONGODB_URI=mongodb://localhost:27017/groovy-bugs
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secure_random_string
```

### 3. Start Development Servers

You will need two terminal windows to run both servers.

**Terminal 1 (Backend)**
```bash
cd backend
npm run dev
# The backend will start on http://localhost:4000
```

**Terminal 2 (Frontend)**
```bash
npm run dev
# The frontend will start on http://localhost:5173
```

## 🤝 Contributing
We welcome contributions! Please review our [CONTRIBUTING.md](./CONTRIBUTING.md) guide before submitting pull requests.

## 📝 License
MIT License
