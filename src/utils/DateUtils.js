const dayjs = require("dayjs")();

class DateUtils {
  expireToken(expDate, check) {
    // expected format => 23-10-2020 16:54:14

    // TODO: Check others that call this api
    let date = new Date(0),
      exp = date.setUTCSeconds(expDate),
      exdateForm = new Date(exp),
      month = exdateForm.getMonth() + 1,
      day = exdateForm.getDate(),
      year = exdateForm.getFullYear(),
      hour = exdateForm.getHours(),
      min = exdateForm.getMinutes(),
      sec = exdateForm.getSeconds();

    if (day < 10) day = "0" + day;
    if (month < 10) month = "0" + month;
    if (hour < 10) hour = "0" + hour;
    if (min < 10) min = "0" + min;
    if (sec < 10) sec = "0" + sec;
    if (check === "")
      // 23-10-2020 16:54:14
      return `${day}-${month}-${year} ${hour}:${min}:${sec}`;
    else return `${min} ${hour} ${day} ${month} *`;
  }

  getDateToRoom() {
    const d = new Date();
    const dd = d.getDate();
    const m = d.getMonth();
    const y = d.getFullYear();
    const h = d.getHours();
    const mm = d.getMinutes();
    const time = h + "" + mm + "_" + dd + "" + m + "" + y;

    return time;
  }

  getRandomNumber() {
    return Math.floor(Math.random() * 1_000_000_000);
  }

  getDate() {
    const date = dayjs.format("DD-MMM-YYYY");

    return date;
  }

  getDateWithStart(startdate) {
    var today = new Date(startdate);
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;
    today = dd + "/" + mm + "/" + yyyy;
    return today;
  }

  getTime(starttime) {
    let time = new Date(starttime);
    let hour = time.getHours();
    let min = time.getMinutes();
    if (hour < 10) hour = "0" + hour;
    if (min < 10) min = "0" + min;
    time = hour + ":" + min;
    return time;
  }

  getLoggerTimestap() {
    const date = dayjs.format("DD/MMM/YYYY:HH:mm:ss");

    return date;
  }

  getSessionTimeout() {
    let tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)),
      month = "" + (tomorrow.getMonth() + 1),
      day = "" + tomorrow.getDate(),
      hour = "" + tomorrow.getHours(),
      min = "" + tomorrow.getMinutes();
    return `${min} ${hour} ${day} ${month} *`;
  }

  getDateTimeFormat() {
    const d = new Date(),
      day = d.getDate(),
      month = d.getMonth() + 1,
      year = d.getFullYear(),
      hour = d.getHours(),
      min = d.getMinutes(),
      sec = d.getSeconds();
    const datestring =
      (day <= 9 ? "0" + day : day) +
      "-" +
      (month <= 9 ? "0" + month : month) +
      "-" +
      year +
      "T" +
      (hour <= 9 ? "0" + hour : hour) +
      "-" +
      (min <= 9 ? "0" + min : min) +
      "-" +
      (sec <= 9 ? "0" + sec : sec);
    return datestring;
  }
}

module.exports = new DateUtils();
