import mongoose from "mongoose";

export const configureDB = async () => {
  mongoose
    .connect(process.env.MONGO_URL!)
    .then((data) => {
      console.log(`Database connected: ${data.connection.host}`);
    })
    .catch((err) => {
      console.log(`Error: ${err.message}`);
      process.exit(1);
    });
};
