import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import path from "path"

const MONGODB_URI = (process.env.MONGODB_URI || "mongodb+srv://rohit46019_db_user:m5j51NXjSGxEzSrs@cluster0.b3gft5l.mongodb.net/telebridge_pro?appName=Cluster0").replace(/^['"]|['"]$/g, '')

// Define Schemas
const joinEventSchema = new mongoose.Schema({
  userId: Number,
  userName: String,
  chatId: Number,
  chatTitle: String,
  timestamp: Number
}, { timestamps: true })

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
}, { timestamps: true })

const broadcastSchema = new mongoose.Schema({
  message: String,
  timestamp: Number,
  sentTo: [{
    chatId: String,
    messageId: Number
  }]
}, { timestamps: true })

const inviteLinkSchema = new mongoose.Schema({
  groupId: String,
  link: String,
  createdAt: { type: Number, default: Date.now }
}, { timestamps: true })

// Define Models
const JoinEvent = mongoose.models.JoinEvent || mongoose.model("JoinEvent", joinEventSchema)
const Group = mongoose.models.Group || mongoose.model("Group", groupSchema)
const Broadcast = mongoose.models.Broadcast || mongoose.model("Broadcast", broadcastSchema)
const InviteLink = mongoose.models.InviteLink || mongoose.model("InviteLink", inviteLinkSchema)

let cachedConnection: typeof mongoose | null = null
let isConnecting = false

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (isConnecting) {
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

  isConnecting = true
  try {
    console.log("Connecting to MongoDB Atlas on Vercel...")
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      dbName: 'telebridge_pro'
    })
    console.log("Connected to MongoDB successfully")
    return conn
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message)
    throw error
  } finally {
    isConnecting = false
  }
}

const app = express()
app.use(cors())
app.use(express.json())

// DB connection middleware with Vercel diagnostics
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err: any) {
    console.error("Vercel DB Connection Failure:", err.message);
    const isIpError = err.message.includes("IP not whitelisted") || 
                      err.message.includes("is not allowed to access from this IP") ||
                      err.message.includes("Could not connect to any servers");

    res.status(503).json({ 
      error: "Database Connection Failed", 
      message: "Unable to connect to MongoDB from Vercel.",
      details: err.message,
      diagnosis: isIpError ? "IP_RESTRICTION" : "UNKNOWN_ERROR",
      advice: isIpError ? 
        "IMPORTANT: You MUST allow '0.0.0.0/0' (Allow access from anywhere) in your MongoDB Atlas Network Access settings." : 
        "Check your MONGODB_URI in Vercel environment variables."
    })
  }
})

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected" })
})

app.get("/api/groups", async (req, res) => {
  try {
    const groups = await Group.find().sort({ lastInteraction: -1 })
    res.json(groups)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch groups" })
  }
})

app.get("/api/events", async (req, res) => {
  try {
    const events = await JoinEvent.find().sort({ timestamp: -1 }).limit(1000)
    res.json(events)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

app.post("/api/groups", async (req, res) => {
  try {
    const group = req.body
    await (Group as any).findOneAndUpdate({ id: group.id }, group, { upsert: true })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to save group" })
  }
})

app.post("/api/groups/remove", async (req, res) => {
  try {
    const { id } = req.body;
    console.log(`[API POST Remove] Removing group with ID: ${id}`);
    if (!id) {
      return res.status(400).json({ error: "Missing group ID" });
    }
    const result = await (Group as any).deleteOne({
      $or: [
        { id: String(id) },
        { id: Number(id) }
      ]
    });
    console.log(`[API POST Remove] Delete result:`, result);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error: any) {
    console.error(`[API POST Remove] Error deleting group:`, error);
    res.status(500).json({ error: "Failed to delete group", details: error.message });
  }
})

app.delete("/api/groups/:id", async (req, res) => {
  try {
    const groupId = req.params.id || req.query.id;
    console.log(`[API] Deleting group with ID: ${groupId}`);
    if (!groupId) {
      return res.status(400).json({ error: "Missing group ID" });
    }
    const result = await (Group as any).deleteOne({
      $or: [
        { id: String(groupId) },
        { id: Number(groupId) }
      ]
    });
    console.log(`[API] Delete result:`, result);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error: any) {
    console.error(`[API] Error deleting group:`, error);
    res.status(500).json({ error: "Failed to delete group", details: error.message });
  }
})

app.put("/api/groups/bulk-update", async (req, res) => {
  try {
    const updates = req.body
    for (const g of updates) {
      await (Group as any).findOneAndUpdate({ id: g.id }, g, { upsert: true })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to update groups" })
  }
})

app.put("/api/groups/:id/interaction", async (req, res) => {
  try {
    await (Group as any).findOneAndUpdate({ id: req.params.id }, { 
      lastInteraction: Date.now(),
      $inc: { interactionCount: 1 }
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to update interaction" })
  }
})

app.post("/api/events", async (req, res) => {
  try {
    const events = req.body
    for (const ev of events) {
      await (JoinEvent as any).findOneAndUpdate({ userId: ev.userId, timestamp: ev.timestamp }, ev, { upsert: true })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to save events" })
  }
})

app.delete("/api/events/:userId/:timestamp", async (req, res) => {
  try {
    await (JoinEvent as any).deleteOne({ userId: Number(req.params.userId), timestamp: Number(req.params.timestamp) })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event" })
  }
})

app.get("/api/groups/:id/links", async (req, res) => {
  try {
    const links = await (InviteLink as any).find({ groupId: req.params.id }).sort({ createdAt: -1 }).limit(10)
    res.json(links)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch links" })
  }
})

app.post("/api/groups/:id/links", async (req, res) => {
  try {
    const { link } = req.body
    if (!link) return res.status(400).json({ error: "Link is required" })
    const newLink = await (InviteLink as any).create({ groupId: req.params.id, link, createdAt: Date.now() })
    res.json({ success: true, id: newLink._id })
  } catch (error) {
    res.status(500).json({ error: "Failed to save link" })
  }
})

app.delete("/api/groups/:id/links", async (req, res) => {
  try {
    const { link } = req.body
    await (InviteLink as any).deleteOne({ groupId: req.params.id, link })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete link" })
  }
})

app.post("/api/revoke-link", async (req, res) => {
  try {
    const { link, token } = req.body
    const inviteLinkDoc = await (InviteLink as any).findOne({ link })
    
    if (!inviteLinkDoc) return res.status(404).json({ error: "Link not found in database" })
    
    const chatId = inviteLinkDoc.groupId
    
    const response = await fetch(`https://api.telegram.org/bot${token}/revokeChatInviteLink?chat_id=${chatId}&invite_link=${link}`)
    const data: any = await response.json()
    
    if (!data.ok) throw new Error(data.description || "Failed to revoke link on Telegram")
    
    await (InviteLink as any).deleteOne({ link })
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to revoke link: " + error.message })
  }
})

app.post("/api/broadcast", async (req, res) => {
  try {
    const { token, message } = req.body
    const groups = await Group.find()
    const timestamp = Date.now()

    if (!groups.length) return res.json({ success: true, sentCount: 0, totalCount: 0 })

    const broadcastRecord = await (Broadcast as any).create({ message, timestamp, sentTo: [] })

    // Vercel background execution (Fire and forget style)
    const sendBatch = async () => {
      const sendPromises = groups.map(async (group) => {
        try {
          const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${group.id}&text=${encodeURIComponent(message)}`, {
            signal: AbortSignal.timeout(8000)
          })
          const data = await response.json()
          if (data.ok) return { chatId: group.id, messageId: data.result.message_id, success: true }
        } catch (err) {}
        return { chatId: group.id, success: false }
      })

      const results = await Promise.all(sendPromises)
      const sentTo = results.filter((r: any) => r.success).map((r: any) => ({ chatId: r.chatId, messageId: r.messageId }))
      await (Broadcast as any).findByIdAndUpdate(broadcastRecord._id, { sentTo })
    }

    // On Vercel, this might finish after the response if lucky, or get killed.
    // However, we must respond to the client.
    await sendBatch()
    
    res.json({ success: true, message: "Broadcast processed" })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to broadcast message", details: error.message })
  }
})

app.get("/api/broadcast", async (req, res) => {
  try {
    const broadcasts = await (Broadcast as any).find().sort({ timestamp: -1 })
    res.json(broadcasts)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch broadcasts" })
  }
})

app.delete("/api/broadcast/:id", async (req, res) => {
  try {
    const token = req.query.token || req.headers['x-bot-token']
    if (!token) return res.status(400).json({ error: "Bot token is required for deletion" })

    const broadcast = await (Broadcast as any).findById(req.params.id)
    if (!broadcast) return res.status(404).json({ error: "Broadcast not found" })

    await (Broadcast as any).findByIdAndDelete(req.params.id)

    // Background deletion
    const deleteBatch = async () => {
      await Promise.allSettled((broadcast.sentTo || []).map(async (item: any) => {
        if (!item.chatId || !item.messageId) return
        try {
          await fetch(`https://api.telegram.org/bot${token}/deleteMessage?chat_id=${item.chatId}&message_id=${item.messageId}`, {
            signal: AbortSignal.timeout(5000)
          })
        } catch (err) {}
      }))
    }
    await deleteBatch()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete broadcast" })
  }
})

// Webhook Handler for 24/7 Join/Leave Cleanup & Welcome
app.post("/api/webhook/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const autoWelcome = req.query.welcome === 'true';
    const autoClean = req.query.clean === 'true';
    const u = req.body;

    // Immediately ACK to Telegram if we want, but on Vercel we MUST wait if we have async work.
    // However, if we take too long (>10s), Telegram will retry.
    // We'll process as much as possible then respond.

    const processUpdate = async () => {
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

        // Handle my_chat_member (Bot's own status changed)
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

        // 2. Process `message` / `channel_post` (Works for visible members)
        const msg = u.message || u.channel_post;
        if (msg && msg.chat) {
          const chatId = msg.chat.id;
          const chatTitle = msg.chat.title;
          const chatIdStr = chatId.toString();
          shouldSyncGroup = msg.chat;

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
             } catch (e) {}

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
           const cutoffLower = ev.timestamp - 120000;
           const cutoffUpper = ev.timestamp + 120000;
           const existing = await (JoinEvent as any).findOne({
             userId: ev.userId,
             chatId: ev.chatId,
             timestamp: { $gt: cutoffLower, $lt: cutoffUpper }
           });

           if (!existing) {
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
                // Background welcome handler for Vercel
                const handleWelcome = async () => {
                  try {
                    await new Promise(r => setTimeout(r, 5000)); // 5 SECONDS DELAY
                    const escapedName = (ev.userName || 'Awesome Member').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                    const text = `🎉 <b>Welcome to the Hub!</b> 🎉\n\nHey <a href="tg://user?id=${ev.userId}"><b>${escapedName}</b></a>, we're thrilled to have you here! ✨\n\n<i>Enjoy your stay, and keep it friendly!</i> 🚀`;
                    
                    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: ev.chatId, text, parse_mode: 'HTML' })
                    });
                    const data: any = await res.json();
                    
                    if (data.ok && data.result) {
                      await new Promise(r => setTimeout(r, 59000)); // 59 SECONDS DELAY
                      await fetch(`https://api.telegram.org/bot${token}/deleteMessage?chat_id=${ev.chatId}&message_id=${data.result.message_id}`).catch(() => {});
                    }
                  } catch (e) {}
                };
                
                // IMPORTANT: In Vercel serverless, we MUST await this 
                // or the function ends and kills the timer.
                // We increase the maxDuration in vercel.json to compensate.
                await handleWelcome();
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
    };

    await processUpdate();
    res.json({ ok: true });
  } catch (err) {
    console.error("Webhook route error:", err);
    res.status(200).json({ ok: true }); // Always 200 for TG
  }
});

export default app
