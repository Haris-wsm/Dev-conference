class RoomDTO {
  user_id;
  name;
  uid;
  key;
  vender;
  setting;
  constructor(room) {
    this.user_id = room.user_id;
    this.name = room.name;
    this.uid = room.uid;
    this.key = room.key;
    this.vender = room.vender;
    this.setting = room.setting;
  }
}
