CREATE DATABASE library_management_system;

CREATE TABLE Book (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    ISBN VARCHAR(13) UNIQUE NOT NULL,
    available_quantity INTEGER NOT NULL,
    shelf_location VARCHAR(255)
);

CREATE TABLE Borrower (
    borrower_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    registered_date DATE NOT NULL
);

CREATE TABLE BorrowingProcess (
    process_id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES Borrower(borrower_id),
    book_id INTEGER NOT NULL REFERENCES Book(book_id),
    check_out_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(15) CHECK (status IN ('returned', 'outstanding')) NOT NULL
);



ALTER TABLE BorrowingProcess
ALTER COLUMN status SET DEFAULT 'outstanding';

ALTER TABLE BorrowingProcess
ALTER COLUMN return_date SET DEFAULT NULL;



INSERT INTO public.book(
  title, author, isbn, available_quantity, shelf_location
)
VALUES
  ('The Lord of the Rings', 'J.R.R. Tolkien', '9780547928227', 5, 'A2'),
  ('The Hitchhiker''s Guide to the Galaxy', 'Douglas Adams', '9780345391803', 2, 'B5'),
  ('Pride and Prejudice', 'Jane Austen', '9780141439518', 3, 'C1');


INSERT INTO public.borrower(
  name, email, registered_date
)
VALUES
  ('John Doe', 'johndoe@example.com', '2023-12-23'),
  ('Jane Smith', 'janesmith@email.com', '2023-12-24'),
  ('Bob Johnson', 'bobjohnson@mail.com', '2023-12-25');


INSERT INTO public.borrowingProcess (
  borrower_id, book_id, check_out_date, due_date, return_date, status
)
VALUES
  (2, 1, '2023-12-15', '2023-12-23', NULL, 'outstanding'),
  (3, 3, '2023-11-13', '2023-12-13', NULL, 'outstanding'),
  (1, 2, '2023-11-8', '2023-11-29', '2023-11-28', 'returned'),
  (1, 3, '2023-12-4', '2024-01-9', '2023-12-18', 'returned'),
  (2, 1, '2023-12-24', '2024-01-20', '2023-12-4', 'returned'),
  (3, 2, '2023-12-5', '2024-01-1', NULL, 'outstanding'),
  (1, 1, '2023-12-16', '2024-01-31', NULL, 'outstanding'),
  (2, 3, '2023-12-3', '2024-01-5', NULL, 'outstanding');