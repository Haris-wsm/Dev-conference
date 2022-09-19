const request = require("supertest");
const app = require("../src/app");

// Models
const User = require("../src/model/user");

beforeEach(() => {});

describe("User Registation", () => {
  // Test pass
  it("returns 200 OK when signup request with one id is valid", async () => {});
  it("return success status when signup request with one id is valid", async () => {});
  it("save the user to database", async () => {});
  it("save the username, password, email, name, lastname, phone number and company name to database", async () => {});
  it("should have the correct object response", async () => {
    //
    // {
    // "status": "success",
    // "message": "harris.waes_1211@thai.com Register successfully.",
    // "email": "harris.waes_1211@thai.com"
    // }
  });

  // Test failed
});
