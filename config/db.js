import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const con = await mongoose.connect(process.env.MONGODB);
    console.log("data base is successfully connected");
    return con;
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
