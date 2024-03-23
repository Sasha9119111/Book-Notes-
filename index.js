// index.js

const express = require('express');
const axios = require('axios');
const ejs = require('ejs');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'book_library',
  password: '911911',
  port: 5432,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const openLibraryApiUrl = 'https://openlibrary.org/search.json';

app.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM books';
    const { rows } = await pool.query(query);
    res.render('index', { books: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/search', async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm;
    const response = await axios.get(openLibraryApiUrl, { params: { q: searchTerm } });
    const books = response.data.docs.slice(0, 1);

   // Додаємо кожну знайдену книгу до бази даних
   for (const book of books) {
    const coverUrl = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`;
    await pool.query('INSERT INTO books (title, author, published_date, isbn, description, cover_url) VALUES ($1, $2, $3, $4, $5, $6)', [book.title, book.author_name ? book.author_name.join(', ') : 'Unknown', book.publish_date ? new Date(book.publish_date[0]) : null, book.isbn ? book.isbn[0] : null, book.subtitle ? book.title + ': ' + book.subtitle : book.title, coverUrl]);
  }
 
  res.sendStatus(200); // Повертаємо успішний статус
} catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}
});

app.delete('/delete/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    await pool.query('DELETE FROM books WHERE id = $1', [bookId]);
    res.sendStatus(200); // Повертаємо статус успішного видалення
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
