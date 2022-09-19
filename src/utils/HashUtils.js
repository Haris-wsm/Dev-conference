const crypto = require("crypto");
const CryptoJS = require("crypto-js");

const env = require("../config/env");

class HashUtils {
  encode(data) {
    try {
      let logic = crypto.createCipher("aes-128-cbc", env.secret_token);
      let encode = logic.update(data, "utf8", "hex");
      encode += logic.final("hex");

      return encode;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  decode(data) {
    try {
      let logic = crypto.createDecipher("aes-128-cbc", env.secret_token);
      let decode = logic.update(data, "hex", "utf8");
      decode += logic.final("utf8");
      return decode;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  decodeToken(token, secretkey) {
    try {
      let logic = crypto.createDecipher("aes-128-cbc", secretkey);
      let decode = logic.update(token, "hex", "utf8");
      decode += logic.final("utf8");
      return decode;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  encodeJS(data) {
    try {
      const ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        process.env.SECRET_TOKEN
      ).toString();
      return ciphertext;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  decodeJS(data) {
    try {
      const bytes = CryptoJS.AES.decrypt(data, process.env.SECRET_TOKEN);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return decryptedData;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  encodeAccessToken(data) {
    try {
      const ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        env.access_token_key
      ).toString();
      return ciphertext;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  decodeAccessToken(data) {
    try {
      const bytes = CryptoJS.AES.decrypt(data, env.access_token_key);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return decryptedData;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}

module.exports = new HashUtils();
