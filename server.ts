import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = (process.env.MONGODB_URI || "mongodb+srv://rohit46019_db_user:m5j51NXjSGxEzSrs@cluster0.b3gft5l.mongodb.net/telebridge_pro?appName=Cluster0").replace(/^['"]|['"]$/g, '');

// Define Schemas
const joinEventSchema = new mongoose.Schema({
  userId: Number,
  userName: String,
  chatId: Number,
  chatTitle: String,
  timestamp: Number
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  memberCount: Number,
  description: String,
  category: String,
  image: String,
  lastInteraction: Number,
  interactionCount: { type: Number, default: 0 },
  pinned: { type: Boolean, default: false }
}, { timestamps: true });

const broadcastSchema = new mongoose.Schema({
  message: String,
  timestamp: Number,
  sentTo: [{
    chatId: String,
    messageId: Number
  }]
}, { timestamps: true });

const inviteLinkSchema = new mongoose.Schema({
  groupId: String,
  link: String,
  createdAt: { type: Number, default: Date.now }
}, { timestamps: true });

// Define Models
const JoinEvent = mongoose.models.JoinEvent || mongoose.model("JoinEvent", joinEventSchema);
const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);
const Broadcast = mongoose.models.Broadcast || mongoose.model("Broadcast", broadcastSchema);
const InviteLink = mongoose.models.InviteLink || mongoose.model("InviteLink", inviteLinkSchema);

// Global Error Handlers to prevent server crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

async function seedData() {
  const defaultGroups: any[] = [
    { "id": "-1003698762401", "name": "GK & GS Brahmastra 4.0 Batch", "memberCount": 5, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003698762401/200", "lastInteraction": 1774102797184, "interactionCount": 0, "pinned": false },
    { "id": "-1003040206839", "name": "ɢᴀɢᴀɴ ᴘʀᴀᴛᴀᴘ", "memberCount": 19, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003040206839/200", "lastInteraction": 1774101136444, "interactionCount": 0, "pinned": false },
    { "id": "-1003339244700", "name": "🎯 Abhinay sir Math", "memberCount": 9, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003339244700/200", "lastInteraction": 1774015354790, "interactionCount": 0, "pinned": false },
    { "id": "-1003036147121", "name": "Aman Sir ENG ( Rec)", "memberCount": 21, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003036147121/200", "lastInteraction": 1773675480941, "interactionCount": 0, "pinned": false },
    { "id": "-1003865582010", "name": "Intense Maths Revision (IMR)", "memberCount": 4, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003865582010/200", "lastInteraction": 1773906201286, "interactionCount": 0, "pinned": false },
    { "id": "-1003114073401", "name": "Himanshi mam CDP", "memberCount": 6, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003114073401/200", "lastInteraction": 1774148078755, "interactionCount": 0, "pinned": false },
    { "id": "-1003612284793", "name": "PARMAR UP GK", "memberCount": 23, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003612284793/200", "lastInteraction": 1774068601367, "interactionCount": 0, "pinned": false },
    { "id": "-1003676915691", "name": "Amarnath sir Hindi", "memberCount": 6, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003676915691/200", "lastInteraction": 1770980589344, "interactionCount": 0, "pinned": false },
    { "id": "-1003225282870", "name": "Selection Way", "memberCount": 31, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003225282870/200", "lastInteraction": 1773385627192, "interactionCount": 0, "pinned": false },
    { "id": "-1003153087650", "name": "Parmar SSC 4.0 🔴Live", "memberCount": 481, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003153087650/200", "lastInteraction": 1775504736123, "interactionCount": 6, "pinned": false },
    { "id": "-1003736636212", "name": "Ultra Calculation", "memberCount": 5, "description": "Auto Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003736636212/200", "lastInteraction": 1773920218031, "interactionCount": 0, "pinned": false },
    { "id": "-1003732445402", "name": "RANI MAM 7.0", "memberCount": 79, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003732445402/100", "lastInteraction": 1774100397699, "interactionCount": 0, "pinned": false },
    { "id": "-1003360985096", "name": "Hindi Foundation Batch 2025 by khan sir", "memberCount": 6, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003360985096/100", "lastInteraction": 1770980272065, "interactionCount": 0, "pinned": false },
    { "id": "-1003067240220", "name": "𝗔𝗗𝗜𝗧𝗬𝗔 𝗦𝗜𝗥 3.0", "memberCount": 35, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003067240220/100", "lastInteraction": 1773975394503, "interactionCount": 0, "pinned": false },
    { "id": "-1003037426232", "name": "𝐕𝐈𝐊𝐑𝐀𝐌𝐉𝐄𝐄𝐓 𝐑𝐄𝐀𝐒𝐎𝐍𝐈𝐍𝐆 𝟑.𝟎", "memberCount": 8, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003037426232/100", "lastInteraction": 1771649376701, "interactionCount": 0, "pinned": false },
    { "id": "-1003767448478", "name": "E1 Coching", "memberCount": 5, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003767448478/100", "lastInteraction": 1770961968213, "interactionCount": 0, "pinned": false },
    { "id": "-1003636154961", "name": "Parmar 2.0 ENG", "memberCount": 9, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003636154961/200", "lastInteraction": 1773971217355, "interactionCount": 0, "pinned": false },
    { "id": "-1003565371067", "name": "RWA sanjeev sir Eng Live", "memberCount": 4, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003565371067/100", "lastInteraction": 1769822904677, "interactionCount": 0, "pinned": false },
    { "id": "-1003856954597", "name": "Nimisha mam", "memberCount": 41, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003856954597/100", "lastInteraction": 1775500553389, "interactionCount": 0, "pinned": false },
    { "id": "-1002793359066", "name": "Piyush Sir Reasoning", "memberCount": 74, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1002793359066/100", "lastInteraction": 1774110379993, "interactionCount": 0, "pinned": false },
    { "id": "-1003577096046", "name": "Math by Bhutesh sir", "memberCount": 11, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003577096046/100", "lastInteraction": 1774104429374, "interactionCount": 0, "pinned": false },
    { "id": "-1003012561565", "name": "Parmar 3.0", "memberCount": 29, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003012561565/100", "lastInteraction": 1774146437398, "interactionCount": 0, "pinned": false },
    { "id": "-1003419167658", "name": "🛑𝚁𝙰𝙽𝙸 𝙼𝙰𝙼 𝟼.𝟶", "memberCount": 23, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003419167658/200", "lastInteraction": 1772894197557, "interactionCount": 0, "pinned": false },
    { "id": "-1002661265147", "name": "Batch 1", "memberCount": 46, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1002661265147/100", "lastInteraction": 1775504589652, "interactionCount": 0, "pinned": false },
    { "id": "-1002986001803", "name": "rakesh yadav", "memberCount": 107, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1002986001803/200", "lastInteraction": 1773996390291, "interactionCount": 0, "pinned": false },
    { "id": "-1003790122016", "name": "Science magnet", "memberCount": 93, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003790122016/200", "lastInteraction": 1775500715439, "interactionCount": 0, "pinned": false },
    { "id": "-1003615370383", "name": "MATH MANIA", "memberCount": 9, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003615370383/200", "lastInteraction": 1775502355637, "interactionCount": 0, "pinned": false },
    { "id": "-1003839638841", "name": "Bhutesh sir math parmar ssc", "memberCount": 4, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003839638841/200", "lastInteraction": 1775504050623, "interactionCount": 7, "pinned": false }
  ];

  try {
    const groupCount = await Group.countDocuments();
    if (groupCount > 0) {
      console.log("Database already has data, skipping seed.");
      return;
    }

    console.log("Database empty, seeding default groups...");
    await Group.insertMany(defaultGroups);
    console.log("Default groups seeded successfully");
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

// Connection state management for serverless (Vercel)
let isConnecting = false;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    // Wait for the active connection attempt to finish
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(check);
          resolve(mongoose.connection);
        }
      }, 500);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error("Database connection timeout"));
      }, 15000);
    });
  }

  isConnecting = true;
  try {
    console.log("Connecting to MongoDB Atlas...");
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      dbName: 'telebridge_pro'
    });
    console.log("Successfully connected to MongoDB");
    
    // Seed data in background
    seedData().catch(err => console.error("Background seeding failed:", err));
    
    return conn;
  } catch (error: any) {
    console.error("MongoDB direct connection error:", error.message);
    throw error;
  } finally {
    isConnecting = false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // DB connection middleware with better diagnostic info
  app.use(async (req, res, next) => {
    // Only require DB for API routes, and exclude the health check to ensure deployment success even if DB is slow.
    if (!req.path.startsWith('/api') || req.path === '/api/health') return next();

    try {
      await connectDB();
      next();
    } catch (err: any) {
      console.error("Vercel DB Connection Failure:", err.message);
      
      const isIpError = err.message.includes("IP not whitelisted") || 
                        err.message.includes("is not allowed to access from this IP") ||
                        err.message.includes("Could not connect to any servers");

      res.status(503).json({ 
        error: "Database Connection Failed", 
        message: "Unable to connect to MongoDB from Vercel.",
        details: err.message,
        diagnosis: isIpError ? "IP_RESTRICTION" : "UNKNOWN_FETCH_ERROR",
        advice: isIpError ? 
          "IMPORTANT: You must allow '0.0.0.0/0' (Allow access from anywhere) in your MongoDB Atlas Network Access settings for Vercel to connect." : 
          "Check your MONGODB_URI in Vercel environment variables."
      });
    }
  });

  // API Routes
  const webhookLogs: any[] = [];

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      uptime: process.uptime(),
      dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString() 
    });
  });

  app.get("/api/diagnostics", (req, res) => {
    res.json(webhookLogs);
  });

  app.post("/api/webhook/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const autoWelcome = req.query.welcome === 'true';
      const autoClean = req.query.clean === 'true';
      const u = req.body;

      // Keep recent 50
      webhookLogs.unshift({ time: new Date().toISOString(), payload: u });
      if (webhookLogs.length > 50) webhookLogs.pop();

      res.json({ ok: true }); // Immediately Ack to telegram

      (async () => {
        try {
          const rawJoinsToAdd: any[] = [];
          const memberChanges: Record<string, number> = {};
          let shouldSyncGroup: any = null;

          // 0. Process `chat_join_request`
          if (u.chat_join_request && u.chat_join_request.chat) {
            const jr = u.chat_join_request;
            rawJoinsToAdd.push({
              userId: jr.from.id,
              userName: jr.from.first_name + (jr.from.last_name ? ` ${jr.from.last_name}` : ''),
              chatId: jr.chat.id,
              chatTitle: jr.chat.title,
              timestamp: jr.date ? jr.date * 1000 : Date.now(),
              is_bot: jr.from.is_bot
            });
            shouldSyncGroup = jr.chat;
          }

          // Handle my_chat_member (Bot's own status changed - added/removed from group)
          if (u.my_chat_member && u.my_chat_member.chat) {
            const myMu = u.my_chat_member;
            const newStatus = myMu.new_chat_member?.status;
            if (['member', 'administrator', 'creator', 'restricted'].includes(newStatus)) {
              shouldSyncGroup = myMu.chat;
            }
          }

          // 1. Process `chat_member` (Admin-only update, works for hidden members)
          if (u.chat_member && u.chat_member.chat) {
            const mu = u.chat_member;
            const chatIdStr = mu.chat.id.toString();
            const oldStatus = mu.old_chat_member?.status;
            const newStatus = mu.new_chat_member?.status;

            const isMemberNow = ['member', 'administrator', 'creator', 'restricted'].includes(newStatus);
            const wasMemberBefore = ['member', 'administrator', 'creator', 'restricted'].includes(oldStatus);

            if (isMemberNow && !wasMemberBefore) {
              rawJoinsToAdd.push({
                userId: mu.new_chat_member.user.id,
                userName: mu.new_chat_member.user.first_name + (mu.new_chat_member.user.last_name ? ` ${mu.new_chat_member.user.last_name}` : ''),
                chatId: mu.chat.id,
                chatTitle: mu.chat.title,
                timestamp: mu.date ? mu.date * 1000 : Date.now(),
                is_bot: mu.new_chat_member.user.is_bot
              });
              shouldSyncGroup = mu.chat;
            } else if (!isMemberNow && wasMemberBefore) {
              memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) - 1;
              shouldSyncGroup = mu.chat;
            }
          }

          // 2. Process `message` / `channel_post` (Works for visible members, handles deletions)
          const msg = u.message || u.channel_post;
          if (msg && msg.chat) {
            const chatId = msg.chat.id;
            const chatTitle = msg.chat.title;
            const chatIdStr = chatId.toString();
            shouldSyncGroup = msg.chat;

            // Auto-Cleanup logic for System Messages
            if (autoClean && (msg.new_chat_members || msg.left_chat_member || msg.new_chat_title || msg.new_chat_photo || msg.delete_chat_photo)) {
              await fetch(`https://api.telegram.org/bot${token}/deleteMessage?chat_id=${chatId}&message_id=${msg.message_id}`, {
                signal: AbortSignal.timeout(5000)
              }).catch(() => {});
            }

            if (msg.new_chat_members) {
              msg.new_chat_members.forEach((newUser: any) => {
                rawJoinsToAdd.push({
                  userId: newUser.id,
                  userName: newUser.first_name + (newUser.last_name ? ` ${newUser.last_name}` : ''),
                  chatId: chatId,
                  chatTitle: chatTitle,
                  timestamp: msg.date ? msg.date * 1000 : Date.now(),
                  is_bot: newUser.is_bot
                });
              });
            }

            if (msg.left_chat_member) {
              memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) - 1;
            }

            if (msg.new_chat_title) {
              await (Group as any).findOneAndUpdate({ id: chatIdStr }, { name: msg.new_chat_title }, { upsert: false });
            }
          }
          
          if (shouldSyncGroup && (['group', 'supergroup', 'channel'].includes(shouldSyncGroup.type))) {
             const chatIdStr = shouldSyncGroup.id.toString();
             const groupExists = await (Group as any).findOne({ id: chatIdStr });
             if (!groupExists) {
               let memberCount = 0;
               try {
                 const countRes = await fetch(`https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${chatIdStr}`);
                 const countData: any = await countRes.json();
                 if (countData.ok) memberCount = countData.result;
               } catch (e) {
                 console.error("Error fetching member count for new group:", e);
               }

               await (Group as any).create({
                 id: chatIdStr,
                 name: shouldSyncGroup.title || 'Unknown',
                 memberCount: memberCount,
                 description: shouldSyncGroup.description || 'Auto Discovered Hub',
                 category: 'Telegram',
                 image: `https://picsum.photos/seed/${chatIdStr}/200`,
                 lastInteraction: Date.now(),
                 interactionCount: 1,
                 createdAt: Date.now()
               });
             } else {
               await (Group as any).findOneAndUpdate({ id: chatIdStr }, { 
                 $set: { lastInteraction: Date.now() }, 
                 $inc: { interactionCount: 1 }
               });
             }
          }

          // 3. Deduplicate joins mathematically!
          for (const ev of rawJoinsToAdd) {
             const cutoffLower = ev.timestamp - 120000; // Deduplicate within 2 mins
             const cutoffUpper = ev.timestamp + 120000;
             const existing = await (JoinEvent as any).findOne({
               userId: ev.userId,
               chatId: ev.chatId,
               timestamp: { $gt: cutoffLower, $lt: cutoffUpper }
             });

             if (!existing) {
               // Only proceed if we haven't tracked this exact join in the last 60s
               await (JoinEvent as any).create({
                 userId: ev.userId,
                 userName: ev.userName,
                 chatId: ev.chatId,
                 chatTitle: ev.chatTitle,
                 timestamp: ev.timestamp
               });

               const chatIdStr = ev.chatId.toString();
               memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) + 1;

               if (autoWelcome && !ev.is_bot) {
                 setTimeout(() => {
                   const escapedName = (ev.userName || 'Awesome Member').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                   const text = `🎉 <b>Welcome to the Hub!</b> 🎉\n\nHey <a href="tg://user?id=${ev.userId}"><b>${escapedName}</b></a>, we're thrilled to have you here! ✨\n\n<i>Enjoy your stay, and keep it friendly!</i> 🚀`;
                   fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ chat_id: ev.chatId, text, parse_mode: 'HTML' })
                   })
                   .then((res: any) => res.json())
                   .then((data: any) => {
                     if (data.ok) {
                       setTimeout(() => {
                         fetch(`https://api.telegram.org/bot${token}/deleteMessage?chat_id=${ev.chatId}&message_id=${data.result.message_id}`).catch(() => {});
                        }, 59000); // 59 SECONDS
                     }
                   }).catch(() => {});
                 }, 5000); // 5 SECONDS
               }
             }
          }

          for (const [chatIdStr, diff] of Object.entries(memberChanges)) {
             if (diff !== 0) {
               await (Group as any).findOneAndUpdate({ id: chatIdStr }, { $inc: { memberCount: diff } });
             }
          }
        } catch (e) {
          console.error("Error processing webhook update:", e);
        }
      })();
    } catch (err) {
      console.error("Webhook route error:", err);
      // Ensure we don't bleed errors and timeout to TG
      res.status(500).json({ error: "Webhook failure" });
    }
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
      const events = await JoinEvent.find().sort({ timestamp: -1 }).limit(1000);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const group = req.body;
      await (Group as any).findOneAndUpdate({ id: group.id }, group, { upsert: true });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save group" });
    }
  });

  app.put("/api/groups/bulk-update", async (req, res) => {
    try {
      const updates = req.body;
      console.log(`[BulkUpdate] Received ${updates.length} group updates`);
      for (const g of updates) {
        console.log(`[BulkUpdate] Updating group ${g.id}, pinned: ${g.pinned}`);
        await (Group as any).findOneAndUpdate({ id: g.id }, g, { upsert: true });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update groups" });
    }
  });

  app.put("/api/groups/:id/interaction", async (req, res) => {
    try {
      await (Group as any).findOneAndUpdate({ id: req.params.id }, { 
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
        await (JoinEvent as any).findOneAndUpdate({ userId: ev.userId, timestamp: ev.timestamp }, ev, { upsert: true });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save events" });
    }
  });

  app.delete("/api/events/:userId/:timestamp", async (req, res) => {
    try {
      await (JoinEvent as any).deleteOne({ userId: Number(req.params.userId), timestamp: Number(req.params.timestamp) });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/groups/:id/interaction", async (req, res) => {
    try {
      await (Group as any).findOneAndUpdate(
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
      const groupId = req.params.id;
      console.log(`[GET] Fetching links for group: ${groupId}`);
      const links = await (InviteLink as any).find({ groupId }).sort({ createdAt: -1 }).limit(10);
      console.log(`[GET] Found ${links.length} links for group ${groupId}`);
      res.json(links);
    } catch (error) {
      console.error("[GET] Failed to fetch links:", error);
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  app.post("/api/groups/:id/links", async (req, res) => {
    try {
      const groupId = req.params.id;
      const { link } = req.body;
      console.log(`[POST] Saving new link for group ${groupId}: ${link}`);
      
      if (!link) {
        return res.status(400).json({ error: "Link is required" });
      }

      const newLink = await (InviteLink as any).create({ 
        groupId, 
        link, 
        createdAt: Date.now() 
      });
      
      console.log(`[POST] Successfully saved link: ${newLink._id}`);
      res.json({ success: true, id: newLink._id });
    } catch (error) {
      console.error("[POST] Failed to save link:", error);
      res.status(500).json({ error: "Failed to save link" });
    }
  });

  app.delete("/api/groups/:id/links", async (req, res) => {
    try {
      const { link } = req.body;
      await (InviteLink as any).deleteOne({ groupId: req.params.id, link });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete link" });
    }
  });

  app.post("/api/broadcast", async (req, res) => {
    try {
      const { token, message } = req.body;
      const groups = await Group.find();
      const timestamp = Date.now();

      if (!groups.length) {
        return res.json({ success: true, sentCount: 0, totalCount: 0 });
      }

      console.log(`[Broadcast] Starting broadcast to ${groups.length} groups`);

      // 1. Initial save so we don't lose the record if it timeouts
      const broadcastRecord = await (Broadcast as any).create({ 
        message, 
        timestamp, 
        sentTo: [] 
      });

      // 2. Parallel sending with a timeout safety
      // Telegram allows 30 msg/sec. For Vercel, we need to be fast.
      const sendPromises = groups.map(async (group) => {
        try {
          const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${group.id}&text=${encodeURIComponent(message)}`, {
            signal: AbortSignal.timeout(8000) // 8 second timeout per request
          });
          const data = await response.json();
          if (data.ok) {
            return { chatId: group.id, messageId: data.result.message_id, success: true };
          }
        } catch (err) {
          console.error(`[Broadcast] Error sending to ${group.id}:`, err);
        }
        return { chatId: group.id, success: false };
      });

      const results = await Promise.all(sendPromises);
      const sentTo = results.filter((r: any) => r.success).map((r: any) => ({ chatId: r.chatId, messageId: r.messageId }));
      
      // 3. Update the record with final results
      await (Broadcast as any).findByIdAndUpdate(broadcastRecord._id, { sentTo });
      
      console.log(`[Broadcast] Completed. Sent to ${sentTo.length}/${groups.length} groups`);
      
      res.json({ 
        success: true, 
        sentCount: sentTo.length, 
        totalCount: groups.length 
      });
    } catch (error: any) {
      console.error("[Broadcast] Global error:", error);
      res.status(500).json({ error: "Failed to broadcast message", details: error.message });
    }
  });

  app.get("/api/broadcast", async (req, res) => {
    try {
      const broadcasts = await (Broadcast as any).find().sort({ timestamp: -1 });
      res.json(broadcasts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broadcasts" });
    }
  });

  app.delete("/api/broadcast/:id", async (req, res) => {
    try {
      const token = req.query.token || req.headers['x-bot-token'];
      if (!token) {
        return res.status(400).json({ error: "Bot token is required for deletion" });
      }

      const broadcast = await (Broadcast as any).findById(req.params.id);
      if (!broadcast) {
        return res.status(404).json({ error: "Broadcast not found" });
      }

      // Delete from DB immediately to free up the request
      await (Broadcast as any).findByIdAndDelete(req.params.id);

      // Perform Telegram deletions in background to avoid Vercel/Cloud Run timeouts
      if (broadcast.sentTo && broadcast.sentTo.length > 0) {
        (async () => {
          console.log(`[DeleteBroadcast] Starting background deletion of ${broadcast.sentTo.length} messages`);
          // Use Promise.all with chunks or just map if the number is reasonable
          // For now, map is fine as we don't await it here.
          await Promise.allSettled(broadcast.sentTo.map(async (item: any) => {
            if (!item.chatId || !item.messageId) return;
            try {
              await fetch(`https://api.telegram.org/bot${token}/deleteMessage?chat_id=${item.chatId}&message_id=${item.messageId}`, {
                signal: AbortSignal.timeout(5000)
              });
            } catch (err) {
              // Ignore individual deletion errors
            }
          }));
          console.log(`[DeleteBroadcast] Background deletion completed for ${req.params.id}`);
        })().catch(err => console.error("Background deletion failed", err));
      }

      res.json({ success: true, message: "Broadcast deletion started in background" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete broadcast" });
    }
  });

  // Vite middleware for development
  let server: any;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const { createServer } = await import("http");
    
    server = createServer(app);
    
    // Wire Vite's HMR websocket into our HTTP server explicitly
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
  } else {
    server = app;
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback: Only serve index.html for non-asset, non-API routes
    app.get('*all', (req, res, next) => {
      // 1. Skip API routes (let them 404 or be handled by handlers)
      if (req.path.startsWith('/api')) {
        return next();
      }
      
      // 2. Skip missing assets (don't serve HTML as JS/CSS/Images)
      const hasExtension = req.path.includes('.') && !req.path.endsWith('.html');
      if (hasExtension) {
        return res.status(404).send('Asset not found');
      }
      
      // 3. Otherwise, serve the SPA index
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  return app;
}

const appPromise = startServer();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
