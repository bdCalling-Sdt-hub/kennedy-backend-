const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Book = require("../model/book.model");
const User = require("../model/user.model");
const Nootification = require("../model/notification.model");
const fs = require("fs");
const path = require("path"); // Ensure path is also required for file operations

const addBook = async (req, res) => {
  try {
    const { bookName, authorName, description, languages, price } = req.body;

    let languagesArray = [];
    if (typeof languages === "string") {
      languagesArray = languages.split(",").map((lang) => lang.trim());
    } else if (Array.isArray(languages)) {
      languagesArray = languages.filter((lang) => typeof lang === "string");
    }

    const newBook = new Book({
      bookName,
      authorName,
      description,
      languages: languagesArray,
      price,
    });

    if (!newBook) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("book could not be added"));
    }

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        newBook.bookCoverImage = imageFileName;
      }
    }
    if (req.files && req.files["pdfFiles"]) {
      const pdfUrls = req.files.pdfFiles.map(
        (file) => `public/uploads/pdfs/${file.filename}`
      );
      newBook.pdfUrls = pdfUrls.length === 1 ? pdfUrls[0] : pdfUrls;
    }
    await newBook.save();
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("book added successfully", newBook));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("error adding book", err.message));
  }
};

const updateBookById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide book id"));
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("book not found"));
    }

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        book.bookCoverImage = imageFileName;
      }
    }

    if (req.files && req.files["pdfFiles"]) {
      const pdfUrls = req.files.pdfFiles.map(
        (file) => `public/uploads/pdfs/${file.filename}`
      );
      book.pdfUrls = pdfUrls.length === 1 ? pdfUrls[0] : pdfUrls;
    }

    if (req.body.languages) {
      let languagesArray;
      if (
        Array.isArray(req.body.languages) &&
        req.body.languages.every((lang) => typeof lang === "string")
      ) {
        languagesArray = req.body.languages;
      } else {
        languagesArray = req.body.languages
          .split(",")
          .map((lang) => lang.trim());
      }
      req.body.languages = languagesArray;
    }

    await book.save();

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedBook) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("book not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated book", updatedBook));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllBooks = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    let query = { isDeleted: false };

    const books = await Book.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const count = await Book.countDocuments(query);

    if (!books) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("books not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all books", {
        result: books,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching books", error.message));
  }
};

const getBookById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("book not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received book", book));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching book", error.message));
  }
};

const deleteBookById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide book id"));
    }
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("book not found"));
    }
    if (book.pdfUrls && book.pdfUrls.length > 0) {
      book.pdfUrls.forEach((pdfUrl) => {
        try {
          fs.unlinkSync(path.join(__dirname, "..", pdfUrl));
        } catch (err) {
          console.error(err);
        }
      });
    }
    if (book.bookCoverImage) {
      try {
        fs.unlinkSync(path.join(__dirname, "..", book.bookCoverImage));
      } catch (err) {
        console.error(err);
      }
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted book", book));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting book", error.message));
  }
};

module.exports = {
  addBook,
  getAllBooks,
  getBookById,

  updateBookById,
  deleteBookById,
};
