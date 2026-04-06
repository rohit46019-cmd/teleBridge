import mongoose from "mongoose";
const MONGODB_URI = "mongodb+srv://rohit46019_db_user:m5j51NXjSGxEzSrs@cluster0.b3gft5l.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGODB_URI).then(async () => {
  const Group = mongoose.model("Group", new mongoose.Schema({}, { strict: false }));
  const groups = await Group.find({});
  console.log(JSON.stringify(groups, null, 2));
  process.exit();
});
