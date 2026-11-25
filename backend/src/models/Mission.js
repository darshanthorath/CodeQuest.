import mongoose from "mongoose";

const missionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  xpReward: { type: Number, default: 30 },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

missionSchema.index({ userId: 1, date: 1, title: 1 }, { unique: true });
export default mongoose.model("Mission", missionSchema);
