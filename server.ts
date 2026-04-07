import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

const MONGODB_URI = (process.env.MONGODB_URI || "mongodb+srv://rohit46019_db_user:m5j51NXjSGxEzSrs@cluster0.b3gft5l.mongodb.net/?appName=Cluster0").replace(/^['"]|['"]$/g, '');

// Define Schemas
const joinEventSchema = new mongoose.Schema({
  userId: Number,
  userName: String,
  chatId: Number,
  chatTitle: String,
  timestamp: Number
});

const groupSchema = new mongoose.Schema({
  id: String,
  name: String,
  memberCount: Number,
  description: String,
  category: String,
  image: String,
  lastInteraction: Number,
  interactionCount: { type: Number, default: 0 },
  pinned: Boolean
});

const broadcastSchema = new mongoose.Schema({
  message: String,
  timestamp: Number,
  sentTo: [{
    chatId: String,
    messageId: Number
  }]
});

const inviteLinkSchema = new mongoose.Schema({
  groupId: String,
  link: String,
  createdAt: Number
});

const JoinEvent = mongoose.model("JoinEvent", joinEventSchema);
const Group = mongoose.model("Group", groupSchema);
const Broadcast = mongoose.model("Broadcast", broadcastSchema);
const InviteLink = mongoose.model("InviteLink", inviteLinkSchema);

async function seedData() {
  const groups = [
    { "id": "-1003698762401", "name": "GK & GS Brahmastra 4.0 Batch", "memberCount": 5, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003698762401/200", "lastInteraction": 1774102797184 },
    { "id": "-1003040206839", "name": "ɢᴀɢᴀɴ ᴘʀᴀᴛᴀᴘ", "memberCount": 19, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003040206839/200", "lastInteraction": 1774101136444 },
    { "id": "-1003339244700", "name": "🎯 Abhinay sir Math", "memberCount": 9, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003339244700/200", "lastInteraction": 1774015354790 },
    { "id": "-1003036147121", "name": "Aman Sir ENG ( Rec)", "memberCount": 21, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003036147121/200", "lastInteraction": 1773675480941 },
    { "id": "-1003865582010", "name": "Intense Maths Revision (IMR)", "memberCount": 4, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003865582010/200", "lastInteraction": 1773906201286 },
    { "id": "-1003114073401", "name": "Himanshi mam CDP", "memberCount": 6, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003114073401/200", "lastInteraction": 1774148078755 },
    { "id": "-1003612284793", "name": "PARMAR UP GK", "memberCount": 23, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003612284793/200", "lastInteraction": 1774068601367 },
    { "id": "-1003676915691", "name": "Amarnath sir Hindi", "memberCount": 6, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003676915691/200", "lastInteraction": 1770980589344 },
    { "id": "-1003225282870", "name": "Selection Way", "memberCount": 31, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003225282870/200", "lastInteraction": 1773385627192 },
    { "id": "-1003153087650", "name": "Parmar SSC 4.0 🔴Live", "memberCount": 481, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003153087650/200", "lastInteraction": 1775504736123, "interactionCount": 6 },
    { "id": "-1003736636212", "name": "Ultra Calculation", "memberCount": 5, "description": "Auto Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003736636212/200", "lastInteraction": 1773920218031 },
    { "id": "-1003732445402", "name": "RANI MAM 7.0", "memberCount": 79, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003732445402/200", "lastInteraction": 1774100397699 },
    { "id": "-1003360985096", "name": "Hindi Foundation Batch 2025 by khan sir", "memberCount": 6, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003360985096/200", "lastInteraction": 1770980272065 },
    { "id": "-1003067240220", "name": "𝗔𝗗𝗜𝗧𝗬𝗔 𝗦𝗜𝗥 3.0", "memberCount": 35, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003067240220/200", "lastInteraction": 1773975394503 },
    { "id": "-1003037426232", "name": "𝐕𝐈𝐊𝐑𝐀𝐌𝐉𝐄𝐄𝐓 𝐑𝐄𝐀𝐒𝐎𝐍𝐈𝐍𝗚 𝟑.𝟎", "memberCount": 8, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003037426232/200", "lastInteraction": 1771649376701 },
    { "id": "-1003767448478", "name": "E1 Coching", "memberCount": 5, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003767448478/200", "lastInteraction": 1770961968213 },
    { "id": "-1003636154961", "name": "Parmar 2.0 ENG", "memberCount": 9, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003636154961/200", "lastInteraction": 1773971217355 },
    { "id": "-1003565371067", "name": "RWA sanjeev sir Eng Live", "memberCount": 4, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003565371067/200", "lastInteraction": 1769822904677 },
    { "id": "-1003856954597", "name": "Nimisha mam", "memberCount": 41, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003856954597/200", "lastInteraction": 1775500553389 },
    { "id": "-1002793359066", "name": "Piyush Sir Reasoning", "memberCount": 74, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1002793359066/200", "lastInteraction": 1774110379993 },
    { "id": "-1003577096046", "name": "Math by Bhutesh sir", "memberCount": 11, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003577096046/200", "lastInteraction": 1774104429374 },
    { "id": "-1003012561565", "name": "Parmar 3.0", "memberCount": 29, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003012561565/200", "lastInteraction": 1774146437398, "pinned": false },
    { "id": "-1003419167658", "name": "🛑𝚁𝙰𝙽𝙸 𝙼𝙰𝙼 𝟼.𝟶", "memberCount": 23, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003419167658/200", "lastInteraction": 1772894197557 },
    { "id": "-1002661265147", "name": "Batch 1", "memberCount": 46, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1002661265147/200", "lastInteraction": 1775504589652, "interactionCount": 0 },
    { "id": "-1002986001803", "name": "rakesh yadav", "memberCount": 107, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1002986001803/200", "lastInteraction": 1773996390291 },
    { "id": "-1003790122016", "name": "Science magnet", "memberCount": 93, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003790122016/200", "lastInteraction": 1775500715439 },
    { "id": "-1003615370383", "name": "MATH MANIA", "memberCount": 9, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003615370383/200", "lastInteraction": 1775502355637, "pinned": false },
    { "id": "-1003839638841", "name": "Bhutesh sir math parmar ssc", "memberCount": 4, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003839638841/200", "lastInteraction": 1775504050623, "pinned": false, "interactionCount": 7 }
  ];

  try {
    console.log("Ensuring default groups exist...");
    for (const group of groups) {
      await Group.findOneAndUpdate({ id: group.id }, group, { upsert: true });
    }
    console.log("Default groups ensured successfully");
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

async function connectDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB successfully");
    
    // Always ensure defaults exist on startup, but don't wipe user data
    await seedData();
    
    const groupCount = await Group.countDocuments();
    console.log(`Current total group count in DB: ${groupCount}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Start DB connection in background
  connectDB().catch(err => console.error("Background DB connection failed:", err));

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    console.log("Health check requested");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/groups", async (req, res) => {
    try {
      console.log("Fetching groups from DB...");
      const groups = await Group.find().sort({ lastInteraction: -1 });
      console.log(`Successfully fetched ${groups.length} groups from DB`);
      res.json(groups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const events = await JoinEvent.find().sort({ timestamp: -1 }).limit(100);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const group = req.body;
      await Group.findOneAndUpdate({ id: group.id }, group, { upsert: true });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save group" });
    }
  });

  app.put("/api/groups/bulk-update", async (req, res) => {
    try {
      const updates = req.body;
      for (const g of updates) {
        await Group.findOneAndUpdate({ id: g.id }, g, { upsert: true });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update groups" });
    }
  });

  app.put("/api/groups/:id/interaction", async (req, res) => {
    try {
      await Group.findOneAndUpdate({ id: req.params.id }, { 
        lastInteraction: Date.now(),
        $inc: { interactionCount: 1 }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update interaction" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const events = req.body;
      for (const ev of events) {
        await JoinEvent.findOneAndUpdate({ userId: ev.userId, timestamp: ev.timestamp }, ev, { upsert: true });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save events" });
    }
  });

  app.delete("/api/events/:userId/:timestamp", async (req, res) => {
    try {
      await JoinEvent.deleteOne({ userId: Number(req.params.userId), timestamp: Number(req.params.timestamp) } as any);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/groups/:id/interaction", async (req, res) => {
    try {
      await Group.findOneAndUpdate(
        { id: req.params.id },
        { 
          $set: { lastInteraction: Date.now() },
          $inc: { interactionCount: 1 }
        },
        { upsert: true }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update interaction" });
    }
  });

  app.get("/api/groups/:id/links", async (req, res) => {
    try {
      console.log(`Fetching links for group: ${req.params.id}`);
      const links = await InviteLink.find({ groupId: req.params.id }).sort({ createdAt: -1 }).limit(10);
      console.log(`Found ${links.length} links for group ${req.params.id}`);
      res.json(links);
    } catch (error) {
      console.error("Failed to fetch links:", error);
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  app.post("/api/groups/:id/links", async (req, res) => {
    try {
      const { link } = req.body;
      console.log(`Saving new link for group ${req.params.id}: ${link}`);
      const newLink = await InviteLink.create({ groupId: req.params.id, link, createdAt: Date.now() });
      console.log(`Successfully saved link: ${newLink._id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save link:", error);
      res.status(500).json({ error: "Failed to save link" });
    }
  });

  app.delete("/api/groups/:id/links", async (req, res) => {
    try {
      const { link } = req.body;
      await InviteLink.deleteOne({ groupId: req.params.id, link });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete link" });
    }
  });

  app.post("/api/broadcast", async (req, res) => {
    try {
      const { token, message } = req.body;
      const groups = await Group.find();
      const sentTo = [];
      const timestamp = Date.now();

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const group of groups) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${group.id}&text=${encodeURIComponent(message)}`);
          const data = await response.json();
          if (data.ok) {
            sentTo.push({ chatId: group.id, messageId: data.result.message_id });
          } else {
            if (data.description === 'Bad Request: TOPIC_CLOSED') {
              console.warn(`Skipping group ${group.id}: Topic is closed.`);
            } else {
              console.error(`Failed to send to ${group.id}:`, data.description);
            }
          }
          await sleep(1000); // 1-second delay between messages
        } catch (err) {
          console.error(`Failed to send to ${group.id}`, err);
        }
      }
      
      await Broadcast.create({ message, timestamp, sentTo });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to broadcast message" });
    }
  });

  app.get("/api/broadcast", async (req, res) => {
    try {
      const broadcasts = await Broadcast.find().sort({ timestamp: -1 });
      res.json(broadcasts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broadcasts" });
    }
  });

  app.delete("/api/broadcast/:id", async (req, res) => {
    try {
      const { token } = req.body;
      const broadcast = await Broadcast.findById(req.params.id);
      if (!broadcast) {
        return res.status(404).json({ error: "Broadcast not found" });
      }

      for (const item of broadcast.sentTo) {
        try {
          await fetch(`https://api.telegram.org/bot${token}/deleteMessage?chat_id=${item.chatId}&message_id=${item.messageId}`);
        } catch (err) {
          console.error(`Failed to delete message ${item.messageId} from ${item.chatId}`, err);
        }
      }

      await Broadcast.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete broadcast" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  return app;
}

startServer();
