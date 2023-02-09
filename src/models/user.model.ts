import mongoose, { Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

export interface I_UserDocument extends mongoose.Document {
  username: string;
  email: string;
  isGoogleAuth: boolean;
  hashedPassword: string;
  avatar: string;
  emailVerified: boolean;
}

const UserSchema: Schema<I_UserDocument> = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minLength: 3,
      validate: {
        validator: function (value: string) {
          return /^[A-Za-z0-9_-\s]*$/.test(value);
        },
        message:
          "Username must only contain letters, numbers, underscores and dashes",
      },
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (value: string) {
          return validator.isEmail(value);
        },
        message: "Email is not valid",
      },
    },

    isGoogleAuth: {
      type: Boolean,
      default: false,
      required: true,
    },

    hashedPassword: {
      type: String,
      select: false,
      minLength: 8,
      trim: true,
    },

    avatar: {
      type: String,
    },

    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

//middlewares
UserSchema.pre("save", async function (next) {
  if (this.isModified("hashedPassword")) {
    const salt = await bcrypt.genSalt(10);

    (this.hashedPassword as string) = await bcrypt.hash(
      this.hashedPassword as string,
      salt
    );
  }

  next();
});

UserSchema.methods.comparePassword = async function (password: string) {
  console.log("validating password");
  return await bcrypt.compare(password, this.hashedPassword);
};

const User = mongoose.model<I_UserDocument>("User", UserSchema);

export default User;
