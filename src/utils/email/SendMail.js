const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { signupTemplate } = require("./template/authentication");
const HashUtils = require("../HashUtils");

class SendMail {
  async confirmEmail(email, name, lastname) {
    try {
      const emailToken = HashUtils.encode(
        jwt.sign({ email: email }, process.env.SECRET_TOKEN, {
          expiresIn: "24h",
        })
      );

      //* Create Email transport
      let transporter;
      if (process.env.NODE_ENV == "development") {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.gmail_user, //* your email
            pass: process.env.gmail_password, //* your email password
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: process.env.gatewayinet,
          port: 25,
          secure: false,
          tls: {
            rejectUnauthorized: false,
          },
        });
      }

      //* Set an Email option for sending email
      const mailOptions = {
        from: '"oneconference@inet.co.th" <oneconference@inet.co.th>',
        to: HashUtils.decode(email), // list of receivers
        subject: "Check your account verification.", // Mail subject
        html: signupTemplate(name, lastname, emailToken),
      };

      let response;
      // send mail with defined transport object

      // TODO: Fix this Promise, delete "res" object here by using it from controller
      await transporter
        .sendMail(mailOptions)
        .then((res) => {
          // console.log(res.accepted);
          response = res.accepted;
          return response;
        })
        .catch((err) => {
          // console.log(err.responseCode);
          response = err.responseCode;
          return response;
        });
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new SendMail();
