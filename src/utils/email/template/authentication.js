const env = require("../../../config/env");

exports.signupTemplate = function (name, lastname, token) {
  const link = `${env.DOMAIN}/backend/api/users/verifyemail/${token}`;
  const html = `
        <b>Hello ${name} ${lastname}</b><br>
        <b>Your recently visited our sign up page using an email which has already been registered and activated.</b>
        <br>
        <b>Click the active below to sign in.</b>
        <br><br><br>
        <a href="${link}" class="btn btn-primary">Active</a><br>
        <br><br>
        <b>Thank you,</b>
        <br>
        <b>One Conference</b>
        `;

  return html;
};
