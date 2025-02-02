const express = require("express");
const routes = express();
const fileUpload = require("../middleware/fileUpload");
const {
  addBook,
  getAllBooks,
  getBookById,
  updateBookById,
  deleteBookById,
} = require("../controller/book.controller");

const { isAuthorizedAdmin } = require("../middleware/authValidationJWT");

routes.post("/add-book", isAuthorizedAdmin, fileUpload(), addBook);

routes.get("/get-all-books", getAllBooks);

routes.get("/get-book-by-id/:id", getBookById);

routes.put(
  "/update-book-by-id/:id",
  isAuthorizedAdmin,
  fileUpload(),
  updateBookById
);

routes.delete("/delete-book-by-id/:id", isAuthorizedAdmin, deleteBookById);

module.exports = routes;
