import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [view, setView] = useState('login'); 
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [books, setBooks] = useState([]);
    const [cart, setCart] = useState([]);
    const [history, setHistory] = useState([]);

    const fetchBooks = async (q = 'programming') => {
        const res = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=20`);
        setBooks(res.data.items.map(i => ({
            id: i.id, title: i.volumeInfo.title, author: i.volumeInfo.authors?.[0] || 'Unknown',
            thumbnail: i.volumeInfo.imageLinks?.thumbnail, preview: i.volumeInfo.previewLink
        })));
    };

    const fetchCart = async () => {
        const res = await axios.get(`http://localhost:5000/api/cart/${userId}`);
        setCart(res.data);
    };

    const fetchHistory = async () => {
        const res = await axios.get(`http://localhost:5000/api/history/${userId}`);
        setHistory(res.data);
    };

    const handleCheckout = async () => {
        await axios.post('http://localhost:5000/api/checkout', { userId });
        alert("Purchase Successful! Items moved to History.");
        fetchCart(); 
        setView('history');
        fetchHistory();
    };

    const handleTransaction = async (book, type) => {
        const price = type === 'buy' ? 499 : type === 'rent' ? 49 : 0;
        await axios.post('http://localhost:5000/api/cart', { userId, bookId: book.id, title: book.title, type, price });
        alert(`Added to ${type}`);
        fetchCart();
    };

    const removeItem = async (id) => {
        await axios.delete(`http://localhost:5000/api/cart/${id}`);
        fetchCart();
    };

    useEffect(() => { if (view === 'dashboard') fetchBooks(); }, [view]);

    return (
        <div className="container">
            <header className="blue-header">
                <h1>Library Management System</h1>
                {view !== 'login' && view !== 'register' && (
                    <div className="nav">
                        <button onClick={() => setView('dashboard')}>Store</button>
                        <button onClick={() => { fetchCart(); setView('cart'); }}>Cart ({cart.filter(i=>i.type!=='wishlist').length})</button>
                        <button onClick={() => { fetchHistory(); setView('history'); }}>History</button>
                        <button onClick={() => setView('login')}>Logout</button>
                    </div>
                )}
            </header>

            {view === 'login' && (
                <div className="auth-card">
                    <input placeholder="User ID" onChange={e => setUserId(e.target.value)} />
                    <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                    <button onClick={async () => {
                        try {
                            await axios.post('http://localhost:5000/api/login', { userId, password });
                            setView('dashboard');
                        } catch { alert("Login Error"); }
                    }}>Login</button>
                    <p onClick={() => setView('register')}>New? Register</p>
                </div>
            )}

            {view === 'dashboard' && (
                <div className="store">
                    <input className="search-bar" placeholder="Search..." onKeyDown={e => e.key === 'Enter' && fetchBooks(e.target.value)} />
                    <div className="book-grid">
                        {books.map(b => (
                            <div className="book-card" key={b.id}>
                                <img src={b.thumbnail} alt={b.title} onClick={() => window.open(b.preview, "_blank")} />
                                <h3>{b.title}</h3>
                                <div className="btn-group">
                                    <button className="buy-btn" onClick={() => handleTransaction(b, 'buy')}>Buy $499</button>
                                    <button className="rent-btn" onClick={() => handleTransaction(b, 'rent')}>Rent $49</button>
                                    <button className="wish-btn" onClick={() => handleTransaction(b, 'wishlist')}>❤️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'cart' && (
                <div className="cart-view">
                    <h2>🛒 Shopping Cart</h2>
                    {cart.filter(i => i.type !== 'wishlist').map(i => (
                        <div key={i._id} className="cart-item">
                            <span>{i.title} ({i.type}) - ${i.price}</span>
                            <button className="remove-btn" onClick={() => removeItem(i._id)}>Remove</button>
                        </div>
                    ))}
                    <button className="checkout-btn" onClick={handleCheckout}>Proceed to Checkout</button>

                    <div className="divider"></div>

                    <h2>❤️ Wishlist</h2>
                    {cart.filter(i => i.type === 'wishlist').map(i => (
                        <div key={i._id} className="cart-item wish">
                            <span>{i.title}</span>
                            <button className="remove-btn" onClick={() => removeItem(i._id)}>Remove</button>
                        </div>
                    ))}
                </div>
            )}

            {view === 'history' && (
                <div className="history-view">
                    <h2>📜 Purchase History</h2>
                    {history.map((h, index) => (
                        <div key={index} className="history-card">
                            <strong>{h.title}</strong>
                            <span>{h.type.toUpperCase()} - ${h.price}</span>
                            <small>{new Date(h.purchaseDate).toLocaleDateString()}</small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default App;