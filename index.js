const status = require("express-status-monitor");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const databaseConnection = require("./config/database");
const UserRouter = require("./routes/user.route");
const AuthRouter = require("./routes/auth.route");
const BookRouter = require("./routes/book.route");
const PodcastRouter = require("./routes/podcast.route");
const ServiceRouter = require("./routes/service.route");
const AppointmentRouter = require("./routes/appointment.route");
const ChatRouter = require("./routes/chat.route");
const NoteRouter = require("./routes/note.route");
const PaymentRouter = require("./routes/payment.route");
const ReviewRouter = require("./routes/review.route");
const termsOfServiceRouter = require("./routes/termsOfService.route");
const faqRouter = require("./routes/faq.route");
const prescriptionRouter = require("./routes/prescription.route");
const tipRouter = require("./routes/tip.route");
const notificationRouter = require("./routes/notification.route");
const helpRouter = require("./routes/help.route");
const aboutUsRouter = require("./routes/aboutUs.route");
const availabilityRouter = require("./routes/availability.route");

const app = express();

dotenv.config();

// const corsOptions = {
//     origin: "http://localhost:5173",
//     credentials: true,
// };

// app.use(cors(corsOptions));

app.use(cors({ origin: "*" }));

app.use(express.json()); // Parses data as JSON
app.use(express.text()); // Parses data as text
app.use(express.urlencoded({ extended: true })); // Parses data as urlencoded

// checks invalid json file
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).send({ message: "invalid json file" });
  }
  next();
});

const PORT = 1010;

app.use(status());

app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/users", UserRouter);
app.use("/users", AuthRouter);
app.use("/books", BookRouter);
app.use("/podcasts", PodcastRouter);
app.use("/service", ServiceRouter);
app.use("/appointment", AppointmentRouter);
app.use("/payment", PaymentRouter);
app.use("/note", NoteRouter);
app.use("/prescription", prescriptionRouter);
app.use("/chats", ChatRouter);
app.use("/review", ReviewRouter);
app.use("/terms-of-service", termsOfServiceRouter);
app.use("/faq", faqRouter);
app.use("/tip", tipRouter);
app.use("/notification", notificationRouter);
app.use("/help", helpRouter);
app.use("/about-us", aboutUsRouter);
app.use("/availability", availabilityRouter);

// Route to handle all other invalid requests

app.get("/", (req, res) => {
  return res.status(200).send({
    name: "Kennedy Affiliate Book Selling Website",
    developer: "Abir ",
    version: "1.0.0",
    description:
      "This is a backend server for Kennedy Affiliate Book Selling Website",
    status: "success",
  });
});

app.use((req, res) => {
  return res.status(400).send({ message: "Route doesnt exist" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: "Internal Server Error" });
});

databaseConnection(() => {
  app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
  });
});
