const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// 1. DATABASE CONNECTION
mongoose.connect("mongodb://127.0.0.1:27017/libraryDB")
    .then(() => console.log("MERN Backend Connected Successfully"))
    .catch(err => console.log("Check if MongoDB is running on 27017!", err));

// 2. DATA MODELS (Schemas)
const User = mongoose.model('User', new mongoose.Schema({
    userId: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

const Cart = mongoose.model('Cart', new mongoose.Schema({
    userId: String,
    bookId: String,
    title: String,
    type: String, 
    price: Number
}));

const History = mongoose.model('History', new mongoose.Schema({
    userId: String,
    bookId: String,
    title: String,
    type: String,
    price: Number,
    purchaseDate: { type: Date, default: Date.now }
}));

// Owner's Custom Inventory Schema
const PrivateBook = mongoose.model('PrivateBook', new mongoose.Schema({
    title: String,
    author: String,
    price: Number,
    category: String,
    isForRent: Boolean
}));

// --- 3. ROUTES ---

// REGISTER & LOGIN
app.post('/api/register', async (req, res) => {
    const { userId, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await new User({ userId, password: hashedPassword }).save();
        res.json({ message: "Account Created" });
    } catch (err) { res.status(400).json({ error: "User already exists" }); }
});

app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId });
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ userId, token: "session_active" });
    } else { res.status(400).json({ error: "Incorrect ID or Password" }); }
});

// CART OPERATIONS
app.post('/api/cart', async (req, res) => {
    await new Cart(req.body).save();
    res.json({ message: "Saved to Cart/Wishlist" });
});

app.get('/api/cart/:userId', async (req, res) => {
    const items = await Cart.find({ userId: req.params.userId });
    res.json(items);
});

app.delete('/api/cart/:id', async (req, res) => {
    await Cart.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// CHECKOUT LOGIC
app.post('/api/checkout', async (req, res) => {
    const { userId } = req.body;
    try {
        const cartItems = await Cart.find({ userId, type: { $ne: 'wishlist' } });
        if (cartItems.length > 0) {
            await History.insertMany(cartItems); // Move to History
            await Cart.deleteMany({ userId, type: { $ne: 'wishlist' } }); // Clear Cart
        }
        res.json({ message: "Checkout processed" });
    } catch (err) { res.status(500).json({ error: "Checkout failed" }); }
});

app.get('/api/history/:userId', async (req, res) => {
    const history = await History.find({ userId: req.params.userId }).sort({ purchaseDate: -1 });
    res.json(history);
});

// OWNER (ADMIN) OPERATIONS
app.post('/api/admin/add-book', async (req, res) => {
    try {
        const newBook = new PrivateBook(req.body);
        await newBook.save();
        res.json({ message: "Book added to your private inventory" });
    } catch (err) { res.status(500).json({ error: "Failed to add book" }); }
});

app.listen(5000, () => console.log("Server active on Port 5000"));