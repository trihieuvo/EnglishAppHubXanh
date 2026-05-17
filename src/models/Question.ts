import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion extends Document {
  text: string;
  level: "Starters" | "Movers" | "Flyers";
  createdAt: Date;
}

const QuestionSchema: Schema<IQuestion> = new Schema(
  {
    text: { type: String, required: true },
    level: {
      type: String,
      enum: ["Starters", "Movers", "Flyers"],
      required: true,
    },
  },
  { timestamps: true }
);

const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
