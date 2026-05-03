const mongoose = require('mongoose');
const Book = mongoose.model('Book', new mongoose.Schema({ title: String, author: String, category: String, isAvailable: Boolean }));

mongoose.connect("mongodb://127.0.0.1:27017/libraryDB");

const categories = ["Fiction", "Science", "History", "Tech", "Business"];
const dummyBooks = [];

for (let i = 1; i <= 100; i++) {
    dummyBooks.push({
        title: `Library Book Vol ${i}`,
        author: `Author ${i}`,
        category: categories[i % 5],
        isAvailable: true
    });
}

const seed = async () => {
    await Book.deleteMany({});
    await Book.insertMany(dummyBooks);
    console.log("100 Books Seeded!");
    process.exit();
};
seed();