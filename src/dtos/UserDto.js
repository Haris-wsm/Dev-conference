class UserDTO {
  _id;
  username;
  name;
  lastname;
  email;
  phonenumber;
  company;
  oneid;
  room_id;
  role;
  avatar_profile;

  constructor(user) {
    this._id = user._id;
    this.username = user.username;
    this.name = user.name;
    this.lastname = user.lastname;
    this.email = user.email;
    this.phonenumber = user.phonenumber;
    this.company = user.company;
    this.oneid = user.oneid;
    this.room_id = user.room_id;
    this.role = user.role;
    this.avatar_profile = user.avatar_profile;
  }
}
