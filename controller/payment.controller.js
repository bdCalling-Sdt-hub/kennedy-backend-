const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Transaction = require("../model/transaction.model");
const User = require("../model/user.model");
const HTTP_STATUS = require("../constants/statusCodes");
const { success, failure } = require("../utilities/common");
const { emailWithNodemailerGmail } = require("../config/email.config");

const createPaymentIntent = async (req, res) => {
  try {
    const { appointmentId, paymentMethodId, amount } = req.body;

    if (!appointmentId || !paymentMethodId || !amount) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide all the fields"));
    }

    // Fetch the appointment details
    const appointment = await Appointment.findById(appointmentId).populate(
      "patientId"
    );

    if (!appointment) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Appointment not found"));
    }

    // Create a payment intent
    let paymentIntent;

    paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in cents
      currency: "usd", // or your preferred currency
      payment_method: paymentMethodId,
      confirm: false, // Do not confirm automatically
    });

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
    const { paymentIntent, appointmentId } = req.body;

    console.log("paymentIntent", paymentIntent);
    console.log("appointmentId", appointmentId);

    if (!paymentIntent || !appointmentId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("please provide paymentIntent and appointmentId"));
    }

    const appointment = await Appointment.findById(appointmentId).populate(
      "patientId serviceId"
    );

    console.log("appointment", appointment);

    if (!appointment) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Appointment not found"));
    }

    // Update the appointment with payment status
    appointment.paymentStatus = "paid";
    appointment.paymentId = paymentIntent.id;
    await appointment.save();

    // Create a new transaction
    const transaction = new Transaction({
      user: appointment.patientId,
      appointment: appointment._id,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: "paid",
    });
    await transaction.save();

    console.log("paymentIntent", paymentIntent.amount);

    console.log("transaction", transaction);

    const service = await Service.findById(appointment.serviceId);
    const selectedDateTime = new Date(appointment.dateTime).getTime();

    if (service) {
      // Remove the selected dateTime from the service's available times
      service.dateTimes = service.dateTimes.filter(
        (time) => new Date(time).getTime() !== selectedDateTime
      );
      await service.save();
    }

    const patientName = appointment.patientId.name || "patient";
    const dateTime = new Date(appointment.dateTime).toLocaleString();
    const emailData = {
      email: appointment.patientId.email,
      subject: "Payment processed successfully",
      html: `
              <h2 style="color: #007BFF; text-align: center;">Appointment Confirmed</h2>
              <p>Dear <strong>${patientName}</strong>,</p>
              <p>Your appointment has been successfully booked</p>
              <p style="padding: 8px 0;"><strong >Appointment Date & Time: </strong> ${dateTime}</p>
              <p>You will recieve a zoom link soon!</p>
              <p>Best regards,</p>
              <p><strong>My Doctor Clinic</strong></p>
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
  getPaymentIntent,
  getAllPaymentIntents,
  confirmPaymentbyPaymentIntent,
};
