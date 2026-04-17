import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import path from "path"

const MONGODB_URI = (process.env.MONGODB_URI || "mongodb+srv://rohit46019_db_user:m5j51NXjSGxEzSrs@cluster0.b3gft5l.mongodb.net/?appName=Cluster0").replace(/^['"]|['"]$/g, '')

// Define Schemas
const joinEventSchema = new mongoose.Schema({
  userId: Number,
  userName: String,
  chatId: Number,
  chatTitle: String,
  timestamp: Number
})

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
})

const broadcastSchema = new mongoose.Schema({
  message: String,
  timestamp: Number,
  sentTo: [{
    chatId: String,
    messageId: Number
  }]
})

const inviteLinkSchema = new mongoose.Schema({
  groupId: String,
  link: String,
  createdAt: Number
})

// Define Models
const JoinEvent = mongoose.models.JoinEvent || mongoose.model("JoinEvent", joinEventSchema)
const Group = mongoose.models.Group || mongoose.model("Group", groupSchema)
const Broadcast = mongoose.models.Broadcast || mongoose.model("Broadcast", broadcastSchema)
const InviteLink = mongoose.models.InviteLink || mongoose.model("InviteLink", inviteLinkSchema)

let cachedConnection: typeof mongoose | null = null

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    cachedConnection = conn
    return conn
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message)
    throw error
  }
}

const app = express()
app.use(cors())
app.use(express.json())

// DB connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err: any) {
    res.status(503).json({ error: "Database connection failed", details: err.message })
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
    const { token } = req.params
    const autoWelcome = req.query.welcome === 'true'
    // Also extracting auto clean query param if passed, defaulting to true to be safe
    const autoClean = req.query.clean !== 'false'
    const update = req.body

    const activeTasks: Promise<any>[] = [];

    // Handle service messages (join/leave)
    if (update.message) {
      const { message_id, chat, new_chat_members, left_chat_member } = update.message
      
      // Update Group registry
      if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
        activeTasks.push(
          (Group as any).findOneAndUpdate(
            { id: chat.id.toString() }, 
            { 
               id: chat.id.toString(), 
               name: chat.title || 'Unknown Group',
               $setOnInsert: { 
                 category: 'Telegram',
                 image: `https://picsum.photos/seed/${chat.id}/200`,
                 lastInteraction: Date.now(),
                 interactionCount: 0
               }
            }, 
            { upsert: true }
          ).exec().catch(() => {})
        );
      }

      if ((new_chat_members || left_chat_member) && autoClean) {
        console.log(`[Webhook] Service message detected in ${chat.id}. Deleting...`)
        
        // Asynchronously delete the service message
        activeTasks.push(
          fetch(`https://api.telegram.org/bot${token}/deleteMessage?chat_id=${chat.id}&message_id=${message_id}`)
            .catch(err => console.error(`[Webhook] Delete failed:`, err))
        );
      }

      // Auto Welcome and DB Save
      if (new_chat_members) {
        
        // Log joins to database
        const eventsToSave: any[] = [];
        new_chat_members.forEach((member: any) => {
          eventsToSave.push({
            userId: member.id,
            userName: member.first_name + (member.last_name ? ` ${member.last_name}` : ''),
            chatId: chat.id,
            chatTitle: chat.title || 'Unknown Group',
            timestamp: update.message.date ? update.message.date * 1000 : Date.now()
          });
        });

        if (eventsToSave.length > 0) {
          activeTasks.push(
            Promise.all(eventsToSave.map(ev => 
               (JoinEvent as any).findOneAndUpdate({ userId: ev.userId, timestamp: ev.timestamp }, ev, { upsert: true })
            )).catch(err => console.error("Webhook DB Save Error:", err))
          );
        }

        // Auto Welcome logic
        if (autoWelcome) {
          activeTasks.push(
            (async () => {
               const sentMessages: number[] = [];
               
               // First send all welcome messages
               for (const member of new_chat_members) {
                 if (member.is_bot) continue;
                 
                 const userName = member.first_name || 'Member';
                 const text = `Welcome <a href="tg://user?id=${member.id}">${userName}</a> to the group! 🎉`;
                 
                 try {
                   const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ chat_id: chat.id, text, parse_mode: 'HTML' })
                   });
                   const data = await res.json();
                   if (data.ok && data.result) {
                     sentMessages.push(data.result.message_id);
                   }
                 } catch (err) {
                   console.error(`[Webhook] Welcome message send error:`, err);
                 }
               }
               
               // If any were sent, hold the Vercel execution for 15 seconds, then delete them
               if (sentMessages.length > 0) {
                 await new Promise(resolve => setTimeout(resolve, 15000));
                 
                 for (const msgId of sentMessages) {
                   try {
                     await fetch(`https://api.telegram.org/bot${token}/deleteMessage?chat_id=${chat.id}&message_id=${msgId}`);
                   } catch (err) {
                     console.error(`[Webhook] Welcome delete error:`, err);
                   }
                 }
               }
            })()
          );
        }
      }
    }

    // Await core tasks before responding, so Vercel doesn't kill the lambda
    await Promise.allSettled(activeTasks);

    res.status(200).send("OK")
  } catch (error) {
    console.error("[Webhook] Error:", error)
    res.status(200).send("OK") // Always return 200 to Telegram
  }
})

export default app
