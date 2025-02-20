const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Transaction = require("../model/transaction.model");
const User = require("../model/user.model");
const Book = require("../model/book.model");
const SubscriptionPlan = require("../model/subscriptionPlan.model");
const Subscription = require("../model/subscription.model");
const Affiliate = require("../model/affiliate.model");
const HTTP_STATUS = require("../constants/statusCodes");
const { success, failure } = require("../utilities/common");
const { emailWithNodemailerGmail } = require("../config/email.config");

const createPaymentIntent = async (req, res) => {
  try {
    const { subscriptionPlan, bookId, paymentMethodId, amount } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("please login"));
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    if (!paymentMethodId || !amount) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide all the fields"));
    }

    if (subscriptionPlan) {
      // Fetch the Subscription details
      const subscription = await SubscriptionPlan.findOne({
        name: subscriptionPlan,
      });

      if (!subscription) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .send(failure("subscription not found"));
      }
    }

    if (bookId) {
      // Fetch the book details
      const book = await Book.findById(bookId);

      if (!book) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .send(failure("book not found"));
      }
    }

    // Create a payment intent
    let paymentIntent;

    paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in cents
      currency: "usd", // or your preferred currency
      payment_method: paymentMethodId,
      confirm: false, // Do not confirm automatically
    });

    user.paymentIntent = paymentIntent.id;
    await user.save();

    if (!paymentIntent) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Payment failed"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payment processed successfully", paymentIntent));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Payment failed", err.message));
  }
};

const confirmPaymentbyPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId, subscriptionPlan, bookId, affiliateCode, price } =
      req.body;

    if (!paymentIntentId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide paymentIntentId"));
    }

    if (!req.user || !req.user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Payment Intent not found"));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    let subscription = null;
    let bookPurchase = null;

    if (bookId) {
      // Check if book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .send(failure("Book not found"));
      }

      // Check if user has already bought a book before
      const hasBoughtBefore = user.booksBought.length > 0;

      if (!hasBoughtBefore && subscriptionPlan) {
        // If it's the user's first book purchase, buy them a subscription
        const subscriptionPlanDetails = await SubscriptionPlan.findOne({
          name: subscriptionPlan,
        });

        if (!subscriptionPlanDetails) {
          return res
            .status(HTTP_STATUS.NOT_FOUND)
            .send(failure("Subscription plan not found"));
        }

        subscription = await Subscription.create({
          subscriptionPlan: subscriptionPlanDetails._id,
          name: subscriptionPlan,
          paymentId: paymentIntent.id,
          paymentStatus: "paid",
          buyer: user._id,
          startDate: new Date(),
          endDate: new Date(
            new Date().getTime() +
              subscriptionPlanDetails.duration * 24 * 60 * 60 * 1000
          ),
        });

        user.subscriptions.push(subscription._id);
        if (subscriptionPlan === "basic") {
          user.isBasicSubscribed = true;
        } else if (subscriptionPlan === "premium") {
          user.isPremiumSubscribed = true;
        }
        user.booksBought.push(book._id);
      } else {
        // If user has already bought a book before, just buy the book
        user.booksBought.push(book._id);
      }
    } else if (subscriptionPlan) {
      // If no book is provided, just buy the subscription
      const subscriptionPlanDetails = await SubscriptionPlan.findOne({
        name: subscriptionPlan,
      });

      if (!subscriptionPlanDetails) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .send(failure("Subscription plan not found"));
      }

      subscription = await Subscription.create({
        subscriptionPlan: subscriptionPlanDetails._id,
        name: subscriptionPlan,
        paymentId: paymentIntent.id,
        paymentStatus: "paid",
        buyer: user._id,
        startDate: new Date(),
        endDate: new Date(
          new Date().getTime() +
            subscriptionPlanDetails.duration * 24 * 60 * 60 * 1000
        ),
      });

      user.subscriptions.push(subscription._id);
      if (subscriptionPlan === "basic") {
        user.isBasicSubscribed = true;
      } else if (subscriptionPlan === "premium") {
        user.isPremiumSubscribed = true;
      }
    } else {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide either subscriptionPlan or bookId"));
    }

    // Handle affiliate commission if affiliateCode is provided
    let affiliate;
    if (affiliateCode) {
      affiliate = await Affiliate.findOne({ affiliateCode });
      if (affiliate && affiliate.stripeAccountId) {
        const commission = price * 0.1; // 10% commission
        await stripe.transfers.create({
          amount: commission * 100,
          currency: paymentIntent.currency,
          destination: affiliate.stripeAccountId,
        });

        affiliate.totalCommission += commission;
        affiliate.totalReferrals += 1;
        if (affiliate.totalCommission >= 240000) affiliate.level = 1;
        if (affiliate.totalCommission >= 500000) affiliate.level = 2;
        if (affiliate.totalCommission >= 1000000) affiliate.level = 3;
        if (affiliate.totalCommission >= 2000000) affiliate.level = 4;
        await affiliate.save();
      }
    }

    // Create a transaction record
    const transaction = new Transaction({
      user: user._id,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: "paid",
    });

    if (bookId) {
      transaction.book = bookId;
    }

    if (subscription) {
      transaction.subscription = subscription._id;
    }

    if (affiliate) {
      const commission = price * 0.1; // 10% commission
      transaction.affiliate = affiliate._id;
      transaction.affiliateComission = commission;
      if (subscription) {
        subscription.affiliate = affiliate._id;
        subscription.affiliateComission = commission;
      }
    }

    await transaction.save();
    await user.save();
    if (subscription) await subscription.save();

    // Send confirmation email
    const userName = user.name || "user";
    const emailData = {
      email: user.email,
      subject: "Payment processed successfully",
      html: `
              <h2 style="color: #007BFF; text-align: center;">Payment Confirmed</h2>
              <p>Dear <strong>${userName}</strong>,</p>
              <p>Your purchase has been successfully completed.</p>
              <p>Best regards,</p>
              <p><strong>Passenger Confession</strong></p>
            `,
    };

    emailWithNodemailerGmail(emailData);

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payment confirmed successfully", paymentIntent));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Payment failed", err.message));
  }
};

const getAffiliateByCode = async (req, res) => {
  try {
    const { affiliateCode } = req.params;
    const affiliate = await Affiliate.findOne({ affiliateCode });
    if (!affiliate) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Affiliate not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Affiliate retrieved successfully", affiliate));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Affiliate failed", err.message));
  }
};

const getPaymentIntent = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    // console.log("paymentIntent", paymentIntent.status);
    if (!paymentIntent) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Payment not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payment retrieved successfully", paymentIntent));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Payment failed", err.message));
  }
};

const getAllPaymentIntents = async (req, res) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list();
    if (!paymentIntents) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Payment intents not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payment intents retrieved successfully", paymentIntents));
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Payment intents failed", err.message));
  }
};

const getAllTransactionsByAffiliate = async (req, res) => {
  try {
    const { affiliateId } = req.params;
    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Affiliate not found"));
    }
    const transactions = await Transaction.find({
      affiliate: affiliateId,
    }).populate("subscription");

    if (!transactions) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Transactions not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success(
        "Transactions retrieved successfully",
        transactions.map((transaction) => ({
          ...transaction.toObject(),
          level: affiliate.level,
        }))
      )
    );
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Transactions failed", err.message));
  }
};

const getAllTransactions = async (req, res) => {
  const { filter } = req.query;
  let transactions;
  try {
    if (filter === "monthly") {
      transactions = await Transaction.aggregate([
        {
          $group: {
            _id: { $month: "$createdAt" },
            amount: { $sum: "$amount" },
          },
        },
        {
          $addFields: {
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      transactions = transactions.map((transaction) => ({
        name: monthNames[transaction._id - 1],
        amt: transaction.amount,
      }));
    } else if (filter === "yearly") {
      transactions = await Transaction.aggregate([
        {
          $group: {
            _id: { $year: "$createdAt" },
            amount: { $sum: "$amount" },
          },
        },
        {
          $addFields: {
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      transactions = transactions.map((transaction) => ({
        name: transaction._id,
        amt: transaction.amount,
      }));
    } else {
      transactions = await Transaction.find().populate("subscription");
      const total = transactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
      );
      transactions = transactions.map((transaction) => {
        const date = new Date(transaction.createdAt);
        return {
          name: date.toLocaleString("default", { month: "short" }),
          amt: transaction.amount,
        };
      });
    }
    if (!transactions) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Transactions not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Transactions retrieved successfully", {
        transactions,
        total: transactions.reduce(
          (total, transaction) => total + transaction.amt,
          0
        ),
      })
    );
  } catch (err) {
    console.error(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Transactions failed", err.message));
  }
};

const getWeeklyTransactions = (transactions) => {
  const weekly = {};
  transactions.forEach((transaction) => {
    const week = getWeek(transaction.createdAt);
    if (!weekly[week]) {
      weekly[week] = 0;
    }
    weekly[week] += transaction.amount;
  });
  return Object.keys(weekly).map((key) => ({
    name: key,
    amt: weekly[key],
  }));
};

const getMonthlyTransactions = (transactions) => {
  const monthly = {};
  transactions.forEach((transaction) => {
    const month = getMonth(transaction.createdAt);
    if (!monthly[month]) {
      monthly[month] = 0;
    }
    monthly[month] += transaction.amount;
  });
  return Object.keys(monthly).map((key) => ({
    name: key,
    amt: monthly[key],
  }));
};

const getYearlyTransactions = (transactions) => {
  const yearly = {};
  transactions.forEach((transaction) => {
    const year = getYear(transaction.createdAt);
    if (!yearly[year]) {
      yearly[year] = 0;
    }
    yearly[year] += transaction.amount;
  });
  return Object.keys(yearly).map((key) => ({
    name: key,
    amt: yearly[key],
  }));
};

const getWeek = (date) => {
  const onejan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date - onejan) / 86400000 + onejan.getDay() + 1) / 7);
};

const getMonth = (date) => {
  return date.toLocaleString("default", { month: "long" });
};

const getYear = (date) => {
  return date.getFullYear();
};

/**
 * @route POST /create-customer
 * @desc Creates a new Stripe customer
 */
const createCustomer = async (req, res) => {
  try {
    const { email, paymentMethodId } = req.body;

    if (!email || !paymentMethodId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide all the fields"));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // res.json({ customerId: customer.id });
    res
      .status(HTTP_STATUS.OK)
      .send(success("Customer created successfully", customer));
  } catch (error) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error creating customer", error.message));
  }
};

/**
 * @route POST /create-subscription
 * @desc Creates a subscription with a fixed duration (e.g., 6 months, 1 year, 2 years)
 */
const createSubscription = async (req, res) => {
  try {
    const { customerId, priceId, duration } = req.body; // Duration: 6_months, 1_year, 2_years

    // Convert duration to UNIX timestamp (current time + duration)
    const durationMapping = {
      "6_months": 6 * 30 * 24 * 60 * 60, // 6 months in seconds
      "1_year": 12 * 30 * 24 * 60 * 60, // 1 year in seconds
      "2_years": 24 * 30 * 24 * 60 * 60, // 2 years in seconds
    };

    if (!durationMapping[duration]) {
      return res.status(400).json({ error: "Invalid duration provided" });
    }

    const cancelAt = Math.floor(Date.now() / 1000) + durationMapping[duration];

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      cancel_at: cancelAt, // Auto-cancel after the specified duration
      expand: ["latest_invoice.payment_intent"],
    });

    // res.json(subscription);
    res
      .status(200)
      .send(success("Subscription created successfully", subscription));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  createCustomer,
  createSubscription,
  getAffiliateByCode,
  getPaymentIntent,
  getAllPaymentIntents,
  getAllTransactions,
  getAllTransactionsByAffiliate,
  confirmPaymentbyPaymentIntent,
};
