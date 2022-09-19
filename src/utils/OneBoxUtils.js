// Models
const Onebox = require("../model/onebox");
const Users = require("../model/user");

// Utils
const LoggerUtils = require("../utils/LoggerUtils");
const HashUtils = require("../utils/HashUtils");

// Library
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Environtments
const env = require("../config/env");

const AuthorizationException = require("../error/AuthorizationException");

class OneBox {
  async getBusiness(accessToken) {
    const header = { headers: { Authorization: `Bearer ${accessToken}` } };
    try {
      const response = await axios.get(process.env.BUSINESS_API, header);
      const dataBusiness = response.data.data;

      const business = [];

      if (!dataBusiness) return null;

      for (const element of dataBusiness) {
        business.push({
          biz_id: element.id,
          tax_id: element.tax_id,
          name_th: encode(element.name_th),
          name_eng: encode(element.name_eng),
        });
      }
      return business;
    } catch (error) {
      console.log(error);
    }
  }

  async getOneBox(accessToken, oneid) {
    const header = { headers: { Authorization: env.ONEBOX_AUTH } };

    const oneBoxData = await this.getAccountOnebox(accessToken, header);

    if (oneBoxData?.length) {
      for (const val of oneBoxData) {
        const accountId = await Onebox.findOne({
          oneid,
          account_id: val.account_id,
        });

        if (!accountId) {
          const mainfolder = await this.getMainfolder(val.account_id);

          const createdNewOneBoxObj = {
            oneid: oneid,
            account_id: val.account_id,
            account_name: val.account_name
              ? HashUtils.encode(
                  val.account_name
                    .replace("บริษัทจำกัด", "")
                    .replace("บริษัทมหาชนจำกัด", "")
                )
              : HashUtils.encode("new Bussiness"),
            email: val.account_name ? HashUtils.encode(val.email) : "",
            mainfolder: mainfolder.folder_id,
          };

          try {
            await Onebox.create(createdNewOneBoxObj);
          } catch (error) {
            LoggerUtils.error("Failed to create new onebox");
            throw new ExternalErrorException("Failed to create new onebox");
          }

          LoggerUtils.info(`oneid: ${oneid}, message: create new onebox.`);
        }
      }
    }

    const accountId = await this.findAccountId(oneid);

    let data = {};
    if (!accountId.length) {
      data.account_id = accountId[0].OneboxAccountid;
    } else {
      data.account_id = oneBoxData[0].account_id;
    }

    data.company = oneBoxData.filter(
      (element) => element.account_name !== "ผู้ใช้ทั่วไป"
    );

    if (!data.company.length) {
      data.company = "ผู้ใช้ทั่วไป";
    } else {
      data.company = data.company[0].account_name;
    }

    return data;
  }

  async findAccountId(oneId) {
    console.log("oneId", oneId);
    const user = await Users.aggregate([
      { $match: { oneid: oneId } },
      {
        $project: {
          _id: {
            $toString: "$_id",
          },
        },
      },
      {
        $lookup: {
          from: "Rooms",
          localField: "_id",
          foreignField: "user_id",
          as: "result",
        },
      },
      {
        $unwind: {
          path: "$result",
        },
      },
      {
        $replaceRoot: {
          newRoot: "$result.setting",
        },
      },
      { $project: { OneboxAccountid: 1 } },
    ]);

    console.log("user aggregate", user);

    return user;
  }

  async getMainfolder(accountId) {
    const account_id = { account_id: accountId };

    // console.log("account_id", account_id);
    const header = { headers: { Authorization: "Bearer " + env.ONEBOX_AUTH } };
    try {
      const response = await axios.post(
        process.env.ONEBOX_GETMAINFOLDER,
        account_id,
        header
      );
      console.log("response", response.data);
      if (response.data.status === "OK") {
        const mainfolder = response.data.result;
        const folder = mainfolder.filter(
          (v) => v.folder_name == "Private Main Folder"
        );

        return folder[0];
      }
    } catch (error) {
      console.log(error.response.data);
    }
  }

  async getAccountOnebox(accesstoken, header) {
    const oneIdToken = { accesstoken };

    let response;

    try {
      response = await axios.post(env.ONEBOX_GETACCOUNT, oneIdToken, header);
    } catch (error) {
      LoggerUtils.error(`Failed to request for create account`);
      throw new AuthorizationException(`Invalid credetails.`);
    }

    const status = response.data.status;

    if (status === "OK") {
      return response.data.result;
    }
  }

  async createFolder(account_id, folder_id, foldername) {
    const header = { headers: { Authorization: process.env.ONEBOX_AUTH } };
    const body = {
      account_id,
      parent_folder_id: folder_id,
      folder_name: foldername,
    };

    let userOnebox = await Onebox.findOne(
      { account_id: account_id },
      "recordfolder"
    );

    if (userOnebox) {
      try {
        let responseCreateFolder = await axios.post(
          env.ONEBOX_CREATEFOLDER,
          body,
          header
        );

        const folderId = responseCreateFolder.data.data.folder_id;

        userOnebox.recordfolder = folderId;
        await userOnebox.save();
        return responseCreateFolder.data;
      } catch (error) {
        LoggerUtils.error(
          `Failed to call request at ${env.ONEBOX_CREATEFOLDER}`
        );
        console.log(error);
      }
    }
  }

  async saveFileOnebox(file, account_id, folder_id) {
    let multipartForm = new FormData();

    try {
      multipartForm.append("account_id", account_id);
      multipartForm.append("folder_id", folder_id);
      multipartForm.append("file", fs.createReadStream(path.resolve(file)));

      let header_formdata = {
        "Content-Type": `multipart/form-data; boundary=${multipartForm._boundary}`,
        Authorization: `Bearer ${env.ONEBOX_AUTH}`,
      };

      let responseSaveOnebox = await axios({
        method: "post",
        url: env.ONEBOX_SAVEFILE,
        data: bodyFormData,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: header_formdata,
      });

      return responseSaveOnebox.FormData;
    } catch (error) {
      LoggerUtils.error("Failed to save file to Onebox");
      console.log(error);
    }
  }

  async getStorage(account_id) {
    const header = { headers: { Authorization: env.ONEBOX_AUTH } };
    const account_ID = { account_id: account_id };

    let oneboxStorageResponse;
    try {
      oneboxStorageResponse = await axios.post(
        env.ONEBOX_GETSTORAGE,
        account_ID,
        header
      );
    } catch (error) {
      console.log(error);
      LoggerUtils.error(
        `Failed to create onebox storage with request at path ${env.ONEBOX_GETSTORAGE}`
      );
    }

    if (oneboxStorageResponse) {
      let oneboxUser = await Onebox.findOne({ account_id: account_id }, [
        "storage",
        "used_storage",
        "remain_storage",
      ]);

      let oneboxStorageData = oneboxStorageResponse.data.result[0];

      oneboxUser.storage = oneboxStorageData.storage;
      oneboxUser.used_storage = oneboxStorageData.used_storage;
      oneboxUser.remain_storage = oneboxStorageData.remain_storage;
      await oneboxUser.save();
    }
  }

  // async getOneBox(accessToken, oneId) {
  //   const header = { headers: { Authorization: process.env.ONEBOX_AUTH } };

  //   try {
  //   } catch (error) {
  //     const oneBoxData = await this.getAccountOnebox(accesstoken);

  //     let data = {};

  //     if (oneBoxData.length) {
  //       for (const value of oneBoxData) {
  //         const checkAccountid = await Onebox.findOne({
  //           oneid: oneid,
  //           account_id: value.account_id,
  //         });
  //       }
  //     }
  //   }
  // }
}

module.exports = new OneBox();
