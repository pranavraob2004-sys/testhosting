const { Pool } = require("pg");
const nodemailer = require("nodemailer");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.handler = async (event) => {
  try {
    const { action, email, otp } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email required" }),
      };
    }

    if (action === "send") {
      const generatedOtp = generateOTP();
      const expiry = new Date(Date.now() + 5 * 60000);

      await pool.query(
        `INSERT INTO users(email, otp, otp_expiry)
         VALUES($1,$2,$3)
         ON CONFLICT (email)
         DO UPDATE SET otp=$2, otp_expiry=$3`,
        [email, generatedOtp, expiry]
      );

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${generatedOtp}`,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "OTP Sent" }),
      };
    }

    if (action === "verify") {
      const result = await pool.query(
        "SELECT * FROM users WHERE email=$1",
        [email]
      );

      if (!result.rows.length) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "User not found" }),
        };
      }

      const user = result.rows[0];

      if (user.otp === otp && new Date(user.otp_expiry) > new Date()) {
        await pool.query(
          "UPDATE users SET verified=true WHERE email=$1",
          [email]
        );

        return {
          statusCode: 200,
          body: JSON.stringify({ message: "OTP Verified Successfully" }),
        };
      }

      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid or Expired OTP" }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid action" }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error" }),
    };
  }
};