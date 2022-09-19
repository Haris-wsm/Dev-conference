// Models
const SessionUsers = require("../../model/sessionUser");
const SessionOTP = require("../../model/otp");

// Utils
const LoggerUtils = require("../../utils/LoggerUtils");
const HashUtils = require("../../utils/HashUtils");

// Error Exception
const ValidationException = require("../../error/ValidationException");

class OtpService {
  async sendOTP(token) {
    const otp_type =
      token.room.setting.TypeOTP === undefined
        ? "sms"
        : token.room.setting.TypeOTP;

    const userData = await SessionUsers.findOne({
      oneid: token.user.oneid,
      username: token.user.username,
      email: token.user.email,
    });
    var access;

    // TODO: create FUnction refreshToken and getAccessTokenByRefreshTokenCollab
    if (token.service.service == "oneid") {
      access = await refreshToken(token.refresh_token);
    } else {
      access = await getAccessTokenByRefreshTokenCollab(token.refresh_token);
    }

    if (!access) {
      LoggerUtils.error(
        `email: ${decode(token.user.email)}, username: ${decode(
          token.user.username
        )}, oneid: ${
          token.user.oneid
        },No send OTP: , message: refresh access token error`
      );
      throw ValidationException("Invalid refresh access token");
    }

    userData.access_token = HashUtils.encodeAccessToken(access.access_token);
    userData.refresh_token = HashUtils.encodeAccessToken(access.refresh_token);
    userData.updated_at = Date.now();
    await userData.save();

    LoggerUtils.info(
      `email: ${HashUtils.decode(userData.email)}, username: ${decode(
        userData.username
      )}, message: get new accesstoken successfully`
    );
    const token_oneid = access.access_token;

    const header = { headers: { Authorization: `Bearer ${token_oneid}` } };

    if (otp_type !== "sms") {
      let otp_message = Math.floor(Math.random() * 899999) + 100000;
      const OtpBelongToUser = await SessionOTP.findOne({
        user_id: token.user.oneid,
      });

      if (!OtpBelongToUser) {
        const create_dataOTP = new SessionOTP({
          user_id: token.user.oneid,
          OTP: otp_message,
        });
        await create_dataOTP.save();
      } else {
        OTPBelongToUser.OTP = otp_message;
        OTPBelongToUser.conter_OTP = 0;
        OTPBelongToUser.updated_at = Date.now();
        await OTPBelongToUser.save();
      }

      const header = {
        headers: {
          Authorization: `Bearer ${process.env.tokenbotonecon}`,
        },
      };

      const sendOtpData = {
        to: token.user.oneid,
        bot_id: env.bot_id,
        type: "text",
        message: `OTP: ${otp_message}`,
        custom_notification: `OTP: ${otp_message}}`,
      };

      let sendotp = await axios.post(
        env.ONEID_SENDOTP_ONECHAT,
        sendOtpData,
        header
      );

      if (sendotp.data.status !== "success") {
        logger.error(
          `email: ${decode(token.user.email)}, username: ${
            token.user.username
          }, oneid: ${token.user.oneid}, OTP: , message: send OTP error`
        );
        throw ValidationException("Error send OTP");
      }

      logger.info(
        `email: ${HashUtils.decode(token.user.email)}, username: ${decode(
          token.user.username
        )}, oneid: ${
          token.user.oneid
        }, OTP: ${otp_message}, message: send OTP to onechat`
      );

      return { status: "success", message: "OTP send" };
    }

    const sendotp = await axios.get(env.ONEID_API_SENDOTP, header);

    if (sendotp.data.result !== "Success") {
      logger.error(
        `email: ${HashUtils.decode(token.user.email)}, username: ${
          token.user.username
        }, oneid: ${token.user.oneid}, OTP: , message: send OTP error`
      );
      throw new ValidationException("Error send OTP");
    }

    logger.info(
      `email: ${HashUtils.decode(token.user.email)}, username: ${decode(
        token.user.username
      )}, oneid: ${token.user.oneid}, OTP: ${
        sendotp.data.data.otp
      }, message: send OTP to sms`
    );
    return { status: "success", message: "OTP send" };
  }

  async checkOTP(token, OTP_sms) {
    const userData = await SessionUsers.findOne({
      oneid: token.user.oneid,
      username: token.user.username,
      email: token.user.email,
    });
    const otp_type =
      token.room.setting.TypeOTP === undefined
        ? "sms"
        : token.room.setting.TypeOTP;

    if (otp_type === "sms") {
      const token_oneid = decodeAccessToken(userData.access_token);

      const header = { headers: { Authorization: `Bearer ${token_oneid}` } };
      const data = { otp: OTP_sms };
      try {
        const checkotp = await axios.post(env.ONEID_API_CHECKOTP, data, header);
        logger.info(
          `email: ${token.user.email}, username: ${token.user.username}, oneid: ${token.user.oneid}, OTP: ${OTP_sms}, message: ${checkotp.data.data}`
        );
        return {
          status: "Success",
          message: "OTP is valid",
        };
      } catch (error) {
        logger.error(
          `email: ${token.user.email}, username: ${token.user.username}, oneid: ${token.user.oneid}, OTP: ${OTP_sms},  message: OTP is invalid, please try again.`
        );
        throw new ValidationException("OTP is invalid, please try again.");
      }
    }

    const findOTP_user = await SessionOTP.findOne({
      user_id: token.user.oneid,
    });

    if (findOTP_user && findOTP_user.OTP == OTP_sms) {
      LoggerUtils.error(
        `email: ${token.user.email}, username: ${token.user.username}, oneid: ${token.user.oneid}, OTP: ${OTP_sms},  message: OTP is invalid, please try again.`
      );
      return {
        status: "Success",
        message: "OTP is valid",
      };
    }

    LoggerUtils.error(
      `email: ${token.user.email}, username: ${token.user.username}, oneid: ${token.user.oneid}, OTP: ${OTP_sms},  message: OTP is invalid, please try again.`
    );

    throw new ValidationException("OTP is invalid, please try again.");
  }
  async testOTP() {
    const url = "https://www.corp-sms.com/CorporateSMS/SMSReceiverXML";
    const tid = "0982807260";
    const msidn = "0838939104";
    const key = md5(msidn + tid);
    const otp = Math.floor(Math.random() * 999999);
    const msg = "OneconferenceOTP: " + otp;
    const data = `<?xml version="1.0" encoding="tis-620" ?> 
              <corpsms_request>
              <key>${key}</key> 
              <header>null</header> 
              <sender>INETSMS</sender> 
              <mtype>T</mtype> 
              <msg>${msg}</msg> 
              <tid>${tid}</tid> 
              <recipients>
              <msisdn>${msidn}</msisdn>
              </recipients>
              </corpsms_request>`;
    const username = "inettest";
    const password = "testinet";
    const token = Buffer.from(`${username}:${password}`, "utf8").toString(
      "base64"
    );
    const header = {
      headers: { "Content-Type": "text/xml", Authorization: `Basic ${token}` },
    };

    try {
      const result = await axios.post(url, data, header);
      return result.data;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new OtpService();
