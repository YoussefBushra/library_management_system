import pg from "pg";

import dbConfig from "../config/db.config.js";

const { Pool } = pg;
const pool = new Pool(dbConfig);

// Get all books
export const getBooks = async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT * FROM book");

    // Extract books from the result
    const books = result.rows;

    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching books" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get book by ID
export const getBookByID = async (req, res) => {
  const client = await pool.connect();

  try {
    const bookId = parseInt(req.params.id);
    const result = await client.query("SELECT * FROM book where book_id = $1", [
      bookId,
    ]);

    // Extract books from the result

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching books" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Add a new book
export const addBook = async (req, res) => {
  const client = await pool.connect();
  try {
    //Get book attributes from request body
    const { title, author, ISBN, available_quantity, shelf_location } =
      req.body;

    await client.query(
      "INSERT INTO Book (title, author, ISBN, available_quantity, shelf_location) VALUES ($1, $2, $3, $4, $5)",
      [title, author, ISBN, available_quantity, shelf_location]
    );

    res.status(201).json({
      message: "Book added successfully",
      added: {
        book: { title, author, ISBN, available_quantity, shelf_location },
      },
    });
  } catch (error) {
    // Handle adding book with the same ISBN error
    if (error.code === "23505") {
      res
        .status(400)
        .json({ message: "A book with the same ISBN already exists" });
    } else {
      console.log(error);
      res.status(500).json({ message: "Error adding book" });
    }
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Update a book by ID
export const updateBook = async (req, res) => {
  const client = await pool.connect();

  try {
    const bookId = parseInt(req.params.id);
    const { title, author, ISBN, available_quantity, shelf_location } =
      req.body;

    // Validate all atrribute exist (basic validation)
    if (!title || !author || !ISBN || available_quantity <= 0) {
      return res.status(400).json({ message: "Invalid book data" });
    }

    await client.query(
      "UPDATE Book SET title = $1, author = $2, isbn = $3, available_quantity = $4, shelf_location = $5 WHERE book_id = $6",
      [title, author, ISBN, available_quantity, shelf_location, bookId]
    );

    res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating book" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Delete a book by ID
export const deleteBook = async (req, res) => {
  // Extract book ID from request parameters
  const bookId = parseInt(req.params.id);

  const client = await pool.connect();
  try {
    // check if book exists
    const result = await client.query("SELECT * FROM Book WHERE book_id = $1", [
      bookId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Execute delete query
    await client.query("DELETE FROM Book WHERE book_id = $1", [bookId]);

    res.status(200).json({
      message: "Book deleted successfully",
      ID: bookId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting book" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

export const findBook = async (req, res) => {
  const client = await pool.connect();
  let paramsCounter = 0; // To keep track of parameters numbers in the query execution

  try {
    const { title, author, ISBN } = req.query; // Extract search terms from query parameters

    let query = "SELECT * FROM Book WHERE "; // Build base query
    let values = []; // Array for query parameter values

    // Add conditions based on provided search terms
    if (title) {
      paramsCounter += 1;
      query += `title ILIKE $${paramsCounter} OR `;
      values.push(`%${title}%`);
    }
    if (author) {
      paramsCounter += 1;
      query += `author ILIKE $${paramsCounter} OR `;
      values.push(`%${author}%`);
      console.log(author);
    }
    if (ISBN) {
      paramsCounter += 1;
      query += `ISBN = $${paramsCounter} OR `;
      values.push(ISBN);
    }

    // Remove trailing "OR " and add ending
    query = query.slice(0, -3) + ";";
    const result = await client.query(query, values);
    const books = result.rows;

    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error searching books" });
  } finally {
    if (client) {
      client.release();
    }
  }
};
