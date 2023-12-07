import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  phone_number: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
