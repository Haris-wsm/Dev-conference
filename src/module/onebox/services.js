// Models
const OneboxFile = require("../../model/oneboxFiles");
const HistoryRooms = require("../../model/historyRoom");

// Errors Exception
const ForbiddenException = require("../../error/ForbiddenException");
const ValidationException = require("../../error/ValidationException");
const ExternalErrorException = require("../../error/ExternalErrorException");

// Environtments
const env = require("../../config/env");

// Libraries
const axios = require("axios");
const path = require("path");
const fs = require("fs");

// Utility
const LoggerUtils = require("../../utils/LoggerUtils");
const DateUtils = require("../../utils/DateUtils");
const OneBoxUtils = require("../../utils/OneBoxUtils");
const HahsUtils = require("../../utils/HashUtils");
const HashUtils = require("../../utils/HashUtils");

class OneBoxService {
  async download(token, file_id) {
    const userFiles = await OneboxFile.findOne(
      { file_id: file_id, user_id: token.user._id },
      "file_id"
    );

    if (!userFiles)
      throw new ForbiddenException("The file does not exist in this account.");

    const header = {
      headers: {
        Authorization: env.ONEBOX_AUTH,
        "Accept-Encoding": "gzip, deflate, br",
      },
    };

    let response;
    try {
      response = await axios.get(env.ONEBOX_DONWLOAD, header, {
        responseType: "arraybuffer",
      });
    } catch (error) {
      // TODO: Add logger
      throw new ValidationException("Failed to get Onebox dowlaod.");
    }

    const json = response.data;
    const filename = "record.mp4";
    const mimetype = "application/mp4";
    LoggerUtils.info(
      `email: ${token.user.email}, username: ${token.user.username}, message: download video file record., file_id: ${file_id}`
    );

    return { json, filename, mimetype };
  }

  async saveOnebox(meetingid) {
    let meetingRoom = await HistoryRooms.findOne({ meeting_id: meetingid }, [
      "user_id",
      "setting.OneboxAccountid",
      "meeting_id",
    ]);

    if (!meetingRoom) throw new ValidationException("Meeting ID was wrong.");

    const user = await Users.findOne({ _id: chkmeeting.user_id }, "email");
    const fileIdOfHistoryRoom = await Historyroom.findOne(
      { meeting_id: meetingid },
      "file_id"
    );
    const oneBoxFolder = await Onebox.findOne(
      { account_id: meetingRoom.setting.OneboxAccountid },
      ["mainfolder", "account_id"]
    );

    // ! Find solution for record video file beacause it will have some problems
    // ! on production with stored file video on individual server with scaling architecture.
    let recordDirPath;
    if (oneBoxFolder) {
      recordDirPath = path.resolve(env.path_record);

      let haveAnyMP4;
      let filenames;
      try {
        filenames = await fs.promises.readdir(recordDirPath);
      } catch (error) {
        LoggerUtils.error(
          `Failed to read directory "recordDirPath" value ${recordDirPath}`
        );
        throw new ExternalErrorException(
          `Failed to read directory ${recordDirPath}`
        );
      }

      haveAnyMP4 = filenames?.some((value, index, _arr) => {
        return value === meetingid + ".mp4";
      });

      if (!haveAnyMP4) {
        throw new ValidationException("This meetingid has not file record.");
      }

      let directoryPath = "";
      const filename = `record-${DateUtils.getDateTimeFormat()}.mp4`;

      const oldPathRecordFile = `${recordDirPath}/${meetingid}.mp4`;
      const newPathRecordFile = `${recordDirPath}/${filename}`;

      try {
        await fs.promises.rename(oldPathRecordFile, newPathRecordFile);
      } catch (error) {
        LoggerUtils.error(
          `Failed to rename at path ${oldPathRecordFile} to ${newPathRecordFile}`
        );
        throw new ExternalErrorException(
          `Failed to rename at path ${oldPathRecordFile} to ${newPathRecordFile}`
        );
      }

      directoryPath = path.resolve(env.path_record + filename);
      let responseOneboxCreateFolder = await OneBoxUtils.createFolder(
        oneBoxFolder.account_id,
        oneBoxFolder.mainfolder,
        "Record_Oneconference"
      );

      let fileSize = this.getFilesizeInBytes(directoryPath);
      let fileBytes = this.bytesToSize(fileSize);

      if (responseOneboxCreateFolder.status === "OK") {
        let saveFile = await OneBoxUtils.saveFileOnebox(
          directoryPath,
          oneBoxFolder.account_id,
          responseOneboxCreateFolder.data.folder_id
        );

        if (saveFile.message !== "insert data success") {
          LoggerUtils.error(
            `email: ${HahsUtils.decode(
              user.email
            )}, meetingid: ${meetingid}, message: Can't save file record ${filename}.`
          );

          await this.movefile(
            filename,
            chkmeeting.user_id,
            user.email,
            meetingid
          );

          return { status: "error", message: "Can't save file." };
        }

        let oneboxFile = new OneboxFile({
          filename: saveFile.data.filename,
          file_id: saveFile.data.id,
          user_id: chkmeeting.user_id,
          size: bytesToSize(saveFile.data.size_file),
          meetingid: chkmeeting.meeting_id,
        });

        fileIdOfHistoryRoom.file_id.push(saveFile.data.id);

        await Promise.all([
          fileIdOfHistoryRoom.save(),
          oneboxFile.save(),
          OneBoxUtils.getStorage(oneBoxFolder.account_id),
        ]);

        LoggerUtils.info(
          `email: ${HashUtils.decode(
            user.email
          )}, meetingid: ${meetingid}, message: save file record ${filename} ${fileBytes} to Onebox Successfully.`
        );

        return saveFile;
      }
    }
  }

  async movefile(filename, user_id, email, meetingid) {
    const pathDirect = env.path_record;
    const backupRecord = env.path_backuprecord;
    let findfile = path.resolve(env.path_backuprecord);
    const currentPath = path.resolve(pathDirect + "/" + filename);

    let newPath = "";

    let filenames;
    try {
      filenames = await fs.promises.readdir(findfile);
    } catch (error) {
      LoggerUtils.error(
        `Failed to move file after created folder Onebox which status "OK" and  "insert data success" message`
      );
      console.log(error);
    }

    let hasFile = filenames?.some(function (value, index, _arr) {
      return value === user_id;
    });

    if (!hasFile) {
      newPath = path.resolve(`${backupRecord}/${user_id}`);

      // ? Check if fs.mkdir can replace with fs.promises.mkdir or not
      fs.mkdir(newPath, (err) => {
        if (err) {
          LoggerUtils.error(`Filed to create Directory at path ${newPath}`);
        } else {
          newPath = path.resolve(
            `${backupRecord}/${user_id}`,
            meetingid + "-01.mp4"
          ); //move file

          // ? Check if fs.rename can use with fs.promises.rename
          fs.rename(currentPath, newPath, (err) => {
            if (err) {
              console.log(err);
              return;
            }
            console.log("Move file to: " + newPath);
            logger.info(
              `email: ${HashUtils.decode(
                email
              )}, message: Move record file to ${newPath}.`
            );
            return;
          });
        }
      });
    }

    findfile = path.resolve(`${backupRecord}/${user_id}`);

    let recordedFilename;
    try {
      recordedFilename = await fs.promises.readdir(findfile);
    } catch (error) {
      throw new ExternalErrorException(
        `Failed to read directory named ${findfile}`
      );
    }

    let filterFiles = recordedFilename.filter(function (value, index, _arr) {
      let checkmeetid = value.includes(meetingid);
      let arr = [];

      if (checkmeetid) {
        arr.push(value);
        return arr;
      }
    });

    if (!filterFiles.length) {
      newPath = path.join(`${backupRecord}/${user_id}/${meetingid}-01.mp4`);
    } else {
      let checkfile = filterFiles.map((value, index, _arr) => {
        if (index == filterFiles.length - 1) {
          let meet = value.split(".");
          let num = meet[0].split("-");
          let count = parseInt(num[2]);
          if (count < 9)
            newPath = path.resolve(
              `${backupRecord}/${user_id}/${meetingid}-0${count + 1}.mp4`
            );
          else
            newPath = path.resolve(
              `${backupRecord}/${user_id}/${meetingid}-${count + 1}.mp4`
            );
          return newPath;
        }
      });
      newPath = checkfile[filterFiles.length - 1];
    }

    // ? Check if fs.rename can be replced with fs.promises.rename
    fs.rename(currentPath, newPath, (err) => {
      if (err) console.log(err);
      console.log("Move file to: " + newPath);
      logger.info(
        `email: ${HashUtils.decode(
          email
        )}, message: Move record file to ${newPath}.`
      );
    });
  }

  async getFilesizeInBytes(filename) {
    // const stats = fs.statSync(filename);
    try {
      const stats = await fs.promises.stat(filename);
      const fileSizeInBytes = stats.size;
      return fileSizeInBytes;
    } catch (error) {
      LoggerUtils.error(`Failed to get stats of file ${filename}`);
      console.log(error);
    }
  }

  async bytesToSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes == 0) return "0 Byte";

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
  }

  async getOneboxBusiness(userData) {
    let bussiness;
    try {
      bussiness = await aggregateOneboxBelongToUser(userData);
    } catch (error) {
      throw new ExternalErrorException(
        "Failed to get Onebox data that matches with user"
      );
    }

    if (!bussiness.length)
      throw new ValidationException("User has not in onebox.");

    const filterData = bussiness.filter((value) => {
      if (bussiness.length > 1) {
        if (HashUtils.decode(value.account_name) != "ผู้ใช้ทั่วไป") {
          value.account_name = HashUtils.decode(value.account_name);
          return value;
        }
      } else {
        value.account_name = HashUtils.decode(value.account_name);
        return value;
      }
    });

    return { status: "success", data: filterData };
  }

  async aggregateOneboxBelongToUser(userData) {
    const bussiness = await Onebox.aggregate([
      // { $match : {'account_name':{$ne: 'ผู้ใช้ทั่วไป'}}},
      {
        $lookup: {
          from: "Users",
          localField: "oneid",
          foreignField: "oneid",
          as: "user_result",
        },
      },
      {
        $match: {
          user_result: {
            $elemMatch: {
              $or: [
                {
                  _id: ObjectId(userData.user._id),
                  oneid: userData.user.oneid,
                },
              ],
            },
          },
        },
      },
      { $project: { account_id: 1, account_name: 1 } },
    ]);

    return bussiness;
  }

  async getOneboxFile(meetingId, userData) {
    let fileData;
    try {
      fileData = await OneboxFile.find(
        { user_id: userData.user._id, meetingid: meetingId },
        ["filename", "file_id", "size"]
      ).sort({ created_at: 1 });
    } catch (error) {
      throw new ExternalErrorException("Failed to retrieve Onebox file");
    }

    if (!fileData.length)
      throw new ValidationException(
        "The file does not exist in this meetingid"
      );
    return { status: "success", data: fileData };
  }
}

module.exports = new OneBoxService();
