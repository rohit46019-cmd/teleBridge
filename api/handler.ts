import express from "express";
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";

const RAW_MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rohit46019_db_user:m5j51NXjSGxEzSrs@cluster0.b3gft5l.mongodb.net/telebridge_pro?appName=Cluster0";
const MONGODB_URI = RAW_MONGODB_URI.replace(/^['"]|['"]$/g, "");

// Define Schemas
const joinEventSchema = new mongoose.Schema(
  {
    userId: Number,
    userName: String,
    chatId: Number,
    chatTitle: String,
    timestamp: Number,
  },
  { timestamps: true }
);

const groupSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    name: String,
    memberCount: { type: Number, default: 0 },
    description: String,
    category: String,
    image: String,
    lastInteraction: Number,
    interactionCount: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
    createdAt: { type: Number, default: () => Date.now() },
    welcomeConfig: {
      enabled: { type: Boolean },
      text: { type: String, default: "" },
      photoUrl: { type: String, default: "" },
      buttonText: { type: String, default: "" },
      buttonUrl: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const folderSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    name: String,
    color: String,
    batchIds: [{ type: String }],
    createdAt: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

const broadcastSchema = new mongoose.Schema(
  {
    message: String,
    timestamp: Number,
    sentTo: [
      {
        chatId: String,
        messageId: Number,
      },
    ],
  },
  { timestamps: true }
);

const inviteLinkSchema = new mongoose.Schema(
  {
    groupId: String,
    groupName: { type: String, default: "" },
    link: String,
    memberLimit: { type: Number, default: 1 },
    expireMinutes: { type: Number, default: 0 },
    expiresAt: { type: Number, default: 0 },
    status: { type: String, default: "active" },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

const botSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    adminAlertChatId: { type: String, default: "" },
    alertOnJoin: { type: Boolean, default: false },
    alertOnSuspicious: { type: Boolean, default: true },
    welcomeEnabled: { type: Boolean, default: false },
    welcomeMessage: { type: String, default: "" },
    autoWelcome: { type: Boolean },
    autoCleanServiceMessages: { type: Boolean },
    autoApproveJoinRequest: { type: Boolean },
  },
  { timestamps: true }
);

const bannedUserSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true },
    userName: { type: String, default: "" },
    chatId: { type: Number, required: true },
    chatTitle: { type: String, default: "" },
    timestamp: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);
bannedUserSchema.index({ userId: 1, chatId: 1 }, { unique: true });

const deletedGroupSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    name: { type: String, default: "" },
    memberCount: { type: Number, default: 0 },
    description: { type: String, default: "" },
    category: { type: String, default: "Telegram" },
    image: { type: String, default: "" },
    pinned: { type: Boolean, default: false },
    deletedAt: { type: Number, default: () => Date.now() },
    errorReason: { type: String, default: "" },
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true },
    username: { type: String, default: "" },
    name: { type: String, default: "" },
    customTitle: { type: String, default: "Admin" },
    isMasterAdmin: { type: Boolean, default: true },
    groups: [{ type: String }],
    permissions: {
      canDeleteMessages: { type: Boolean, default: true },
      canRestrictMembers: { type: Boolean, default: true },
      canInviteUsers: { type: Boolean, default: true },
      canPinMessages: { type: Boolean, default: true },
      canChangeInfo: { type: Boolean, default: false },
      canManageVideoChats: { type: Boolean, default: true },
      canManageTopics: { type: Boolean, default: true },
      canPromoteMembers: { type: Boolean, default: false },
    },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

const pendingJoinSchema = new mongoose.Schema(
  {
    userId: Number,
    chatId: Number,
    userName: String,
    timestamp: Number,
  },
  { timestamps: true }
);

function getModel(name: string, schema: mongoose.Schema): any {
  return mongoose.models[name] || mongoose.model(name, schema);
}

const JoinEvent = getModel("JoinEvent", joinEventSchema);
const Group = getModel("Group", groupSchema);
const Folder = getModel("Folder", folderSchema);
const Broadcast = getModel("Broadcast", broadcastSchema);
const InviteLink = getModel("InviteLink", inviteLinkSchema);
const Admin = getModel("Admin", adminSchema);
const PendingJoin = getModel("PendingJoin", pendingJoinSchema);
const BotSettings = getModel("BotSettings", botSettingsSchema);
const BannedUserModel = getModel("BannedUser", bannedUserSchema);
const DeletedGroupModel = getModel("DeletedGroup", deletedGroupSchema);

let connectPromise: Promise<typeof mongoose> | null = null;

async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      dbName: "telebridge_pro",
    })
    .then((conn) => {
      connectPromise = null;
      return conn;
    })
    .catch((err: any) => {
      connectPromise = null;
      console.error("MongoDB connection error:", err?.message || err);
      throw err;
    });

  return connectPromise;
}

const normalizeTimestampMs = (ts: any): number => {
  const num = Number(ts);
  if (!num || Number.isNaN(num)) return Date.now();
  return num < 1e12 ? num * 1000 : num;
};

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Fast health & diagnostics
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    dbStatus: mongoose.connection.readyState === 1 ? "connected" : "connecting",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/diagnostics", async (_req: Request, res: Response) => {
  try {
    await connectDB();
  } catch {
    // report readyState below
  }
  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    nodeVersion: process.version,
    dbReadyState: mongoose.connection.readyState,
    dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

const requireDB = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err: any) {
    const message = err?.message || "Unknown database error";
    const isIpError =
      message.includes("IP not whitelisted") ||
      message.includes("is not allowed to access from this IP") ||
      message.includes("Could not connect to any servers");

    res.status(503).json({
      error: "Database Connection Failed",
      message: "Unable to connect to MongoDB from Vercel.",
      details: message,
      diagnosis: isIpError ? "IP_RESTRICTION" : "UNKNOWN_ERROR",
      advice: isIpError
        ? "Allow '0.0.0.0/0' in MongoDB Atlas Network Access settings."
        : "Check MONGODB_URI in Vercel environment variables.",
    });
  }
};

// Groups Routes
app.get("/api/groups", requireDB, async (_req: Request, res: Response) => {
  try {
    const groups = await Group.find().sort({ lastInteraction: -1 }).lean();
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch groups", details: error?.message });
  }
});

app.post("/api/groups", requireDB, async (req: Request, res: Response) => {
  try {
    const group = req.body;
    if (!group || !group.id) {
      res.status(400).json({ error: "Missing group ID" });
      return;
    }
    await Group.findOneAndUpdate({ id: String(group.id) }, group, { upsert: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save group", details: error?.message });
  }
});

app.post("/api/groups/remove", requireDB, async (req: Request, res: Response) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ error: "Missing group ID" });
      return;
    }
    const result = await Group.deleteOne({
      $or: [{ id: String(id) }, { id: Number(id) }],
    });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete group", details: error?.message });
  }
});

app.delete("/api/groups/:id", requireDB, async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id || (req.query.id as string);
    if (!groupId) {
      res.status(400).json({ error: "Missing group ID" });
      return;
    }
    const result = await Group.deleteOne({
      $or: [{ id: String(groupId) }, { id: Number(groupId) }],
    });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete group", details: error?.message });
  }
});

app.put("/api/groups/bulk-update", requireDB, async (req: Request, res: Response) => {
  try {
    const updates = Array.isArray(req.body) ? req.body : [];
    for (const g of updates) {
      if (g && g.id) {
        await Group.findOneAndUpdate({ id: String(g.id) }, g, { upsert: true });
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update groups", details: error?.message });
  }
});

const handleGroupInteraction = async (req: Request, res: Response) => {
  try {
    await Group.findOneAndUpdate(
      { id: String(req.params.id) },
      {
        $set: { lastInteraction: Date.now() },
        $inc: { interactionCount: 1 },
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update interaction", details: error?.message });
  }
};

app.put("/api/groups/:id/interaction", requireDB, handleGroupInteraction);
app.post("/api/groups/:id/interaction", requireDB, handleGroupInteraction);

// Events Routes
app.get("/api/events", requireDB, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 1000, 5000);
    const events = await JoinEvent.find().sort({ timestamp: -1 }).limit(limit).lean();
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch events", details: error?.message });
  }
});

app.post("/api/events", requireDB, async (req: Request, res: Response) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [];
    for (const ev of events) {
      if (ev && ev.userId !== undefined && ev.timestamp !== undefined) {
        const tsMs = normalizeTimestampMs(ev.timestamp);
        await JoinEvent.findOneAndUpdate(
          { userId: Number(ev.userId), timestamp: tsMs },
          { ...ev, userId: Number(ev.userId), timestamp: tsMs },
          { upsert: true }
        );
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save events", details: error?.message });
  }
});

app.delete("/api/events/:userId/:timestamp", requireDB, async (req: Request, res: Response) => {
  try {
    await JoinEvent.deleteOne({
      userId: Number(req.params.userId),
      timestamp: Number(req.params.timestamp),
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete event", details: error?.message });
  }
});

// Folders Routes
app.get("/api/folders", requireDB, async (_req: Request, res: Response) => {
  try {
    const folders = await Folder.find().sort({ createdAt: -1 }).lean();
    res.json(folders);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch folders", details: error?.message });
  }
});

app.post("/api/folders", requireDB, async (req: Request, res: Response) => {
  try {
    const folder = req.body;
    if (!folder || !folder.id) {
      res.status(400).json({ error: "Missing folder ID" });
      return;
    }
    await Folder.findOneAndUpdate({ id: String(folder.id) }, folder, { upsert: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save folder", details: error?.message });
  }
});

app.post("/api/folders/bulk", requireDB, async (req: Request, res: Response) => {
  try {
    const folders = Array.isArray(req.body) ? req.body : [];
    for (const folder of folders) {
      if (folder && folder.id) {
        await Folder.findOneAndUpdate(
          { id: String(folder.id) },
          {
            id: String(folder.id),
            name: String(folder.name || "Untitled"),
            color: String(folder.color || "from-indigo-600 to-blue-600"),
            batchIds: Array.isArray(folder.batchIds) ? folder.batchIds.map(String) : [],
            createdAt: Number(folder.createdAt) || Date.now(),
          },
          { upsert: true }
        );
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to bulk sync folders", details: error?.message });
  }
});

app.delete("/api/folders/:id", requireDB, async (req: Request, res: Response) => {
  try {
    await Folder.deleteOne({ id: String(req.params.id) });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete folder", details: error?.message });
  }
});

// Banned Users Routes
app.get("/api/bans", requireDB, async (_req: Request, res: Response) => {
  try {
    const bans = await BannedUserModel.find().sort({ timestamp: -1 }).lean();
    res.json(bans);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch banned users", details: error?.message });
  }
});

app.post("/api/bans", requireDB, async (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    for (const item of items) {
      if (!item || item.userId === undefined || item.chatId === undefined) continue;
      const userId = Number(item.userId);
      const chatId = Number(item.chatId);
      if (Number.isNaN(userId) || Number.isNaN(chatId)) continue;
      await BannedUserModel.findOneAndUpdate(
        { userId, chatId },
        {
          userId,
          chatId,
          userName: String(item.userName || `User ${userId}`).slice(0, 120),
          chatTitle: String(item.chatTitle || "Group").slice(0, 160),
          timestamp: Number(item.timestamp) || Date.now(),
        },
        { upsert: true }
      );
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save banned user", details: error?.message });
  }
});

app.delete("/api/bans/:userId/:chatId", requireDB, async (req: Request, res: Response) => {
  try {
    await BannedUserModel.deleteOne({
      userId: Number(req.params.userId),
      chatId: Number(req.params.chatId),
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to remove banned user", details: error?.message });
  }
});

// Deleted Groups Bin Routes (30-day retention in MongoDB)
app.get("/api/deleted-groups", requireDB, async (_req: Request, res: Response) => {
  try {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    await DeletedGroupModel.deleteMany({ deletedAt: { $lt: cutoff } });
    const items = await DeletedGroupModel.find().sort({ deletedAt: -1 }).lean();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch deleted bin", details: error?.message });
  }
});

app.post("/api/deleted-groups", requireDB, async (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    for (const item of items) {
      if (!item || !item.id) continue;
      await DeletedGroupModel.findOneAndUpdate(
        { id: String(item.id) },
        {
          id: String(item.id),
          name: String(item.name || "Unknown Hub"),
          memberCount: Number(item.memberCount) || 0,
          description: String(item.description || ""),
          category: String(item.category || "Telegram"),
          image: String(item.image || ""),
          pinned: Boolean(item.pinned),
          deletedAt: Number(item.deletedAt) || Date.now(),
          errorReason: String(item.errorReason || "Bad request / Unaccessible"),
        },
        { upsert: true }
      );
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save deleted bin item", details: error?.message });
  }
});

app.delete("/api/deleted-groups/:id", requireDB, async (req: Request, res: Response) => {
  try {
    await DeletedGroupModel.deleteOne({ id: String(req.params.id) });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete bin item", details: error?.message });
  }
});

app.delete("/api/deleted-groups", requireDB, async (_req: Request, res: Response) => {
  try {
    await DeletedGroupModel.deleteMany({});
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to empty deleted bin", details: error?.message });
  }
});

// Invite Links Routes (Per-Group & Global Active Links Manager)
const computeLinkStatus = (doc: any) => {
  const now = Date.now();
  let status = doc.status || "active";
  if (status === "active" && doc.expiresAt && doc.expiresAt > 0 && now > doc.expiresAt) {
    status = "expired";
  }
  return { ...doc, status };
};

app.get("/api/links", requireDB, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const links = await InviteLink.find().sort({ createdAt: -1 }).limit(limit).lean();
    const groups = await Group.find({}, { id: 1, name: 1 }).lean();
    const groupMap = new Map(groups.map((g: any) => [String(g.id), g.name]));
    const enriched = links.map((l: any) => {
      const withStatus = computeLinkStatus(l);
      return {
        ...withStatus,
        groupName: withStatus.groupName || groupMap.get(String(withStatus.groupId)) || `Hub ${withStatus.groupId}`,
      };
    });
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch active links", details: error?.message });
  }
});

app.delete("/api/links/:id", requireDB, async (req: Request, res: Response) => {
  try {
    await InviteLink.findByIdAndDelete(String(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete link record", details: error?.message });
  }
});

app.get("/api/groups/:id/links", requireDB, async (req: Request, res: Response) => {
  try {
    const links = await InviteLink.find({ groupId: String(req.params.id) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(links.map(computeLinkStatus));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch links", details: error?.message });
  }
});

app.post("/api/groups/:id/links", requireDB, async (req: Request, res: Response) => {
  try {
    const { link, groupName, memberLimit, expireMinutes, expiresAt } = req.body || {};
    if (!link || typeof link !== "string") {
      res.status(400).json({ error: "Link is required" });
      return;
    }
    const expMins = Number(expireMinutes) || 0;
    const computedExpiresAt =
      Number(expiresAt) > 0
        ? Number(expiresAt)
        : expMins > 0
        ? Date.now() + expMins * 60 * 1000
        : 0;
    const newLink = await InviteLink.create({
      groupId: String(req.params.id),
      groupName: typeof groupName === "string" ? groupName.slice(0, 120) : "",
      link: link.trim(),
      memberLimit: Number(memberLimit) >= 0 ? Number(memberLimit) : 1,
      expireMinutes: expMins,
      expiresAt: computedExpiresAt,
      status: "active",
      createdAt: Date.now(),
    });
    res.json({ success: true, id: newLink._id, record: newLink });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save link", details: error?.message });
  }
});

app.delete("/api/groups/:id/links", requireDB, async (req: Request, res: Response) => {
  try {
    const { link } = req.body || {};
    if (typeof link !== "string") {
      res.status(400).json({ error: "Valid link string required" });
      return;
    }
    await InviteLink.deleteOne({ groupId: String(req.params.id), link });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete link", details: error?.message });
  }
});

app.post("/api/revoke-link", requireDB, async (req: Request, res: Response) => {
  try {
    const { link, token, chatId } = req.body || {};
    if (!link || !token || typeof link !== "string" || typeof token !== "string") {
      res.status(400).json({ error: "Link and token required" });
      return;
    }

    let targetChatId = chatId ? String(chatId) : undefined;
    if (!targetChatId) {
      const inviteLinkDoc = await InviteLink.findOne({ link });
      if (inviteLinkDoc) {
        targetChatId = inviteLinkDoc.groupId;
      }
    }

    let success = false;
    let telegramError = "";

    if (targetChatId) {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/revokeChatInviteLink`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: targetChatId, invite_link: link }),
          signal: AbortSignal.timeout(8000),
        }
      );
      const data: any = await response.json();
      if (data.ok) {
        success = true;
      } else {
        telegramError = data.description || "Failed on Telegram";
      }
    }

    if (!success) {
      const allGroups = await Group.find().lean();
      for (const grp of allGroups) {
        try {
          const response = await fetch(
            `https://api.telegram.org/bot${token}/revokeChatInviteLink`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: grp.id, invite_link: link }),
              signal: AbortSignal.timeout(5000),
            }
          );
          const data: any = await response.json();
          if (data.ok) {
            success = true;
            targetChatId = grp.id;
            break;
          } else if (!telegramError) {
            telegramError = data.description;
          }
        } catch {
          // continue checking next group
        }
      }
    }

    if (!success) {
      res.status(400).json({
        error:
          telegramError ||
          "Could not revoke invite link. Check if bot is admin and link is valid.",
      });
      return;
    }

    await InviteLink.updateMany({ link }, { $set: { status: "revoked" } });
    res.json({ success: true, chatId: targetChatId });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to revoke link: " + (error?.message || error) });
  }
});

// Bot Settings & Instant Telegram Admin Alerts Routes
const escapeHtml = (str: string) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isValidHttpUrl = (val?: string): boolean => {
  if (!val || typeof val !== "string") return false;
  try {
    const parsed = new URL(val.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const getISTDateKeyServer = (ts: number = Date.now()) => {
  const ist = new Date(ts + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

app.get("/api/bot-settings", requireDB, async (_req: Request, res: Response) => {
  try {
    const doc = await BotSettings.findOne({ key: "default" }).lean();
    res.json(
      doc || {
        key: "default",
        adminAlertChatId: "",
        alertOnJoin: false,
        alertOnSuspicious: true,
        welcomeEnabled: false,
        welcomeMessage: "",
      }
    );
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch bot settings", details: error?.message });
  }
});

app.post("/api/bot-settings", requireDB, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const updateData: Record<string, any> = { key: "default" };
    if (body.adminAlertChatId !== undefined) {
      updateData.adminAlertChatId =
        typeof body.adminAlertChatId === "string" || typeof body.adminAlertChatId === "number"
          ? String(body.adminAlertChatId).trim().slice(0, 64)
          : "";
    }
    if (body.alertOnJoin !== undefined) updateData.alertOnJoin = Boolean(body.alertOnJoin);
    if (body.alertOnSuspicious !== undefined) updateData.alertOnSuspicious = Boolean(body.alertOnSuspicious);
    if (body.welcomeEnabled !== undefined) updateData.welcomeEnabled = Boolean(body.welcomeEnabled);
    if (typeof body.welcomeMessage === "string") updateData.welcomeMessage = body.welcomeMessage.slice(0, 2000);
    if (body.autoWelcome !== undefined) updateData.autoWelcome = Boolean(body.autoWelcome);
    if (body.autoCleanServiceMessages !== undefined) updateData.autoCleanServiceMessages = Boolean(body.autoCleanServiceMessages);
    if (body.autoApproveJoinRequest !== undefined) updateData.autoApproveJoinRequest = Boolean(body.autoApproveJoinRequest);

    const saved = await BotSettings.findOneAndUpdate(
      { key: "default" },
      { $set: updateData },
      { upsert: true, new: true }
    );
    res.json({ success: true, settings: saved });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save bot settings", details: error?.message });
  }
});

app.post("/api/alerts/test", requireDB, async (req: Request, res: Response) => {
  try {
    const { token, chatId } = req.body || {};
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Bot token is required" });
      return;
    }
    const targetChatId = String(chatId || "").trim();
    if (!targetChatId) {
      res.status(400).json({ error: "Admin Telegram Chat ID is required" });
      return;
    }
    const text = `🔔 <b>TeleBridge Admin Alert Connected!</b>\n\n✅ Instant Bot DM alerts are active for this Telegram ID.\n🕒 <i>Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</i>`;
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: targetChatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(8000),
    });
    const data: any = await response.json();
    if (!data.ok) {
      res.status(400).json({ error: data.description || "Telegram rejected alert. Start the bot first with /start." });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to send test alert", details: error?.message });
  }
});

app.post("/api/alerts/daily-summary", requireDB, async (req: Request, res: Response) => {
  try {
    const { token, chatId } = req.body || {};
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Bot token is required" });
      return;
    }
    const settingsDoc = await BotSettings.findOne({ key: "default" }).lean();
    const targetChatId = String(chatId || settingsDoc?.adminAlertChatId || "").trim();
    if (!targetChatId) {
      res.status(400).json({ error: "Admin Telegram Chat ID is required" });
      return;
    }

    const todayKey = getISTDateKeyServer(Date.now());
    const yesterdayKey = getISTDateKeyServer(Date.now() - 86400000);
    const events = await JoinEvent.find().sort({ timestamp: -1 }).limit(3000).lean();
    const groups = await Group.find().lean();

    let todayCount = 0;
    let yesterdayCount = 0;
    const hubCounts: Record<string, { title: string; count: number }> = {};

    for (const ev of events) {
      const ts = normalizeTimestampMs(ev.timestamp);
      const key = getISTDateKeyServer(ts);
      if (key === todayKey) {
        todayCount++;
        const cid = String(ev.chatId || "");
        if (!hubCounts[cid]) {
          hubCounts[cid] = { title: ev.chatTitle || `Hub ${cid}`, count: 0 };
        }
        hubCounts[cid].count++;
      } else if (key === yesterdayKey) {
        yesterdayCount++;
      }
    }

    const trend =
      yesterdayCount === 0
        ? todayCount > 0
          ? 100
          : 0
        : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
    const totalMembers = groups.reduce((acc: number, g: any) => acc + (Number(g.memberCount) || 0), 0);
    const topHubs = Object.values(hubCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topHubLines =
      topHubs.length > 0
        ? topHubs.map((h, i) => `${i + 1}. <b>${escapeHtml(h.title)}</b> — ${h.count} joins`).join("\n")
        : "<i>No joins recorded today yet.</i>";

    const text =
      `📊 <b>Daily Hub Summary (${todayKey} IST)</b>\n\n` +
      `👥 <b>Today Joins:</b> ${todayCount} (${trend >= 0 ? "+" : ""}${trend}% vs yesterday)\n` +
      `📅 <b>Yesterday Joins:</b> ${yesterdayCount}\n` +
      `🌐 <b>Active Hubs:</b> ${groups.length} (${totalMembers.toLocaleString()} total members)\n\n` +
      `🏆 <b>Top Active Hubs Today:</b>\n${topHubLines}`;

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: targetChatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(8000),
    });
    const data: any = await response.json();
    if (!data.ok) {
      res.status(400).json({ error: data.description || "Failed to send summary DM" });
      return;
    }
    res.json({ success: true, todayCount, yesterdayCount, trend });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to send daily summary", details: error?.message });
  }
});

// Broadcast Routes
app.get("/api/broadcast", requireDB, async (_req: Request, res: Response) => {
  try {
    const broadcasts = await Broadcast.find().sort({ timestamp: -1 }).lean();
    res.json(broadcasts);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch broadcasts", details: error?.message });
  }
});

app.post("/api/broadcast", requireDB, async (req: Request, res: Response) => {
  try {
    const { token, message } = req.body || {};
    if (!token || !message) {
      res.status(400).json({ error: "Token and message required" });
      return;
    }

    const groups = await Group.find().lean();
    const timestamp = Date.now();
    if (!groups.length) {
      res.json({ success: true, sentCount: 0, totalCount: 0 });
      return;
    }

    const broadcastRecord = await Broadcast.create({ message, timestamp, sentTo: [] });

    const results = await Promise.all(
      groups.map(async (group: any) => {
        try {
          const response = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: group.id, text: message }),
              signal: AbortSignal.timeout(8000),
            }
          );
          const data: any = await response.json();
          if (data.ok) {
            return { chatId: group.id, messageId: data.result.message_id, success: true };
          }
        } catch {
          // ignore
        }
        return { chatId: group.id, success: false };
      })
    );

    const sentTo = results
      .filter((r) => r.success)
      .map((r) => ({ chatId: r.chatId, messageId: r.messageId }));

    await Broadcast.findByIdAndUpdate(broadcastRecord._id, { sentTo });

    res.json({
      success: true,
      sentCount: sentTo.length,
      totalCount: groups.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to broadcast message", details: error?.message });
  }
});

app.delete("/api/broadcast/:id", requireDB, async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || (req.headers["x-bot-token"] as string);
    if (!token) {
      res.status(400).json({ error: "Bot token is required for deletion" });
      return;
    }

    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) {
      res.status(404).json({ error: "Broadcast not found" });
      return;
    }

    await Broadcast.findByIdAndDelete(req.params.id);

    await Promise.allSettled(
      (broadcast.sentTo || []).map(async (item: any) => {
        if (!item.chatId || !item.messageId) return;
        try {
          await fetch(
            `https://api.telegram.org/bot${token}/deleteMessage?chat_id=${item.chatId}&message_id=${item.messageId}`,
            { signal: AbortSignal.timeout(5000) }
          );
        } catch {
          // ignore
        }
      })
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete broadcast", details: error?.message });
  }
});

// Admin Management Endpoints
app.get("/api/admins", requireDB, async (_req: Request, res: Response) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 }).lean();
    res.json(admins);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch admins", details: error?.message });
  }
});

app.post("/api/admins", requireDB, async (req: Request, res: Response) => {
  try {
    const adminData = req.body || {};
    if (!adminData.userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    const updated = await Admin.findOneAndUpdate(
      { userId: Number(adminData.userId) },
      adminData,
      { upsert: true, new: true }
    );
    res.json({ success: true, admin: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save admin", details: error?.message });
  }
});

app.delete("/api/admins/:userId", requireDB, async (req: Request, res: Response) => {
  try {
    await Admin.deleteOne({ userId: Number(req.params.userId) });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete admin", details: error?.message });
  }
});

app.post("/api/admin/promote", requireDB, async (req: Request, res: Response) => {
  try {
    const {
      token,
      userId,
      username,
      name,
      customTitle,
      groupScope,
      groupIds,
      permissions,
      isMasterAdmin,
    } = req.body || {};
    if (!token || !userId) {
      res.status(400).json({ error: "Bot token and userId are required" });
      return;
    }

    const numericUserId = Number(userId);
    if (Number.isNaN(numericUserId)) {
      res.status(400).json({ error: "Valid numeric userId is required" });
      return;
    }

    const targetGroups =
      groupScope === "all" || !groupIds || groupIds.length === 0
        ? await Group.find().lean()
        : await Group.find({ id: { $in: groupIds } }).lean();

    const results = await Promise.all(
      targetGroups.map(async (grp: any) => {
        try {
          const params = new URLSearchParams({
            chat_id: grp.id.toString(),
            user_id: numericUserId.toString(),
            can_manage_chat: "true",
            can_delete_messages: permissions?.canDeleteMessages !== false ? "true" : "false",
            can_restrict_members: permissions?.canRestrictMembers !== false ? "true" : "false",
            can_invite_users: permissions?.canInviteUsers !== false ? "true" : "false",
            can_pin_messages: permissions?.canPinMessages !== false ? "true" : "false",
            can_change_info: permissions?.canChangeInfo ? "true" : "false",
            can_manage_video_chats: permissions?.canManageVideoChats !== false ? "true" : "false",
            can_manage_topics: permissions?.canManageTopics !== false ? "true" : "false",
            can_promote_members: permissions?.canPromoteMembers ? "true" : "false",
          });

          const resp = await fetch(
            `https://api.telegram.org/bot${token}/promoteChatMember?${params.toString()}`
          );
          const data: any = await resp.json();

          if (data.ok && customTitle && String(customTitle).trim()) {
            try {
              const titleParams = new URLSearchParams({
                chat_id: grp.id.toString(),
                user_id: numericUserId.toString(),
                custom_title: String(customTitle).trim().slice(0, 16),
              });
              await fetch(
                `https://api.telegram.org/bot${token}/setChatAdministratorCustomTitle?${titleParams.toString()}`
              );
            } catch {
              // ignore
            }
          }

          return {
            groupId: grp.id,
            groupName: grp.name,
            success: data.ok,
            error: data.ok ? null : data.description,
          };
        } catch (e: any) {
          return {
            groupId: grp.id,
            groupName: grp.name,
            success: false,
            error: e?.message,
          };
        }
      })
    );

    const cleanUsername = String(username || "").replace(/^@/, "");
    const adminRecord = await Admin.findOneAndUpdate(
      { userId: numericUserId },
      {
        userId: numericUserId,
        username: cleanUsername,
        name: name || (cleanUsername ? `@${cleanUsername}` : `User ${numericUserId}`),
        customTitle: customTitle || "Admin",
        isMasterAdmin: isMasterAdmin !== false,
        groups: groupScope === "all" ? ["all"] : groupIds || [],
        permissions: {
          canDeleteMessages: permissions?.canDeleteMessages !== false,
          canRestrictMembers: permissions?.canRestrictMembers !== false,
          canInviteUsers: permissions?.canInviteUsers !== false,
          canPinMessages: permissions?.canPinMessages !== false,
          canChangeInfo: !!permissions?.canChangeInfo,
          canManageVideoChats: permissions?.canManageVideoChats !== false,
          canManageTopics: permissions?.canManageTopics !== false,
          canPromoteMembers: !!permissions?.canPromoteMembers,
        },
        createdAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      promotedCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      totalGroups: targetGroups.length,
      admin: adminRecord,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to promote admin", details: error?.message });
  }
});

app.post("/api/admin/demote", requireDB, async (req: Request, res: Response) => {
  try {
    const { token, userId, groupScope, groupIds } = req.body || {};
    if (!token || !userId) {
      res.status(400).json({ error: "Bot token and userId are required" });
      return;
    }

    const numericUserId = Number(userId);
    const targetGroups =
      groupScope === "all" || !groupIds || groupIds.length === 0
        ? await Group.find().lean()
        : await Group.find({ id: { $in: groupIds } }).lean();

    const results = await Promise.all(
      targetGroups.map(async (grp: any) => {
        try {
          const params = new URLSearchParams({
            chat_id: grp.id.toString(),
            user_id: numericUserId.toString(),
            can_manage_chat: "false",
            can_delete_messages: "false",
            can_restrict_members: "false",
            can_invite_users: "false",
            can_pin_messages: "false",
            can_change_info: "false",
            can_manage_video_chats: "false",
            can_manage_topics: "false",
            can_promote_members: "false",
          });
          const resp = await fetch(
            `https://api.telegram.org/bot${token}/promoteChatMember?${params.toString()}`
          );
          const data: any = await resp.json();
          return {
            groupId: grp.id,
            groupName: grp.name,
            success: data.ok,
            error: data.ok ? null : data.description,
          };
        } catch (e: any) {
          return {
            groupId: grp.id,
            groupName: grp.name,
            success: false,
            error: e?.message,
          };
        }
      })
    );

    await Admin.deleteOne({ userId: numericUserId });
    res.json({
      success: true,
      demotedCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to demote admin", details: error?.message });
  }
});

app.get("/api/admin/resolve-user", requireDB, async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || "").trim();
    if (!query) {
      res.json({ matches: [] });
      return;
    }

    const cleanQuery = query.replace(/^@/, "");
    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isNumeric = /^\d+$/.test(cleanQuery);

    const matches: any[] = [];
    const seenIds = new Set<number>();

    if (isNumeric) {
      const numId = Number(cleanQuery);
      seenIds.add(numId);
      const existingEvent = await JoinEvent.findOne({ userId: numId })
        .sort({ timestamp: -1 })
        .lean();
      const existingAdmin = await Admin.findOne({ userId: numId }).lean();
      matches.push({
        userId: numId,
        userName: existingAdmin?.name || existingEvent?.userName || `User ${numId}`,
        username: existingAdmin?.username || "",
        source: existingAdmin ? "admin" : existingEvent ? "join_event" : "direct_id",
      });
    }

    const eventMatches = await JoinEvent.find({
      userName: { $regex: escapedQuery, $options: "i" },
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    for (const em of eventMatches) {
      if (!seenIds.has(em.userId)) {
        seenIds.add(em.userId);
        matches.push({ userId: em.userId, userName: em.userName, source: "join_event" });
      }
    }

    const adminMatches = await Admin.find({
      $or: [
        { username: { $regex: escapedQuery, $options: "i" } },
        { name: { $regex: escapedQuery, $options: "i" } },
      ],
    })
      .limit(5)
      .lean();

    for (const am of adminMatches) {
      if (!seenIds.has(am.userId)) {
        seenIds.add(am.userId);
        matches.push({
          userId: am.userId,
          userName: am.name,
          username: am.username,
          source: "admin",
        });
      }
    }

    res.json({ matches });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to resolve user", details: error?.message });
  }
});

// Webhook Handler for Vercel Serverless (must complete DB writes fast before returning 200)
app.post("/api/webhook/:token", async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const autoWelcome = req.query.welcome === "true";
    const autoClean = req.query.clean === "true";
    const autoApprove = req.query.approve === "true";
    const u = req.body || {};

    await connectDB();

    const rawJoinsToAdd: any[] = [];
    const memberChanges: Record<string, number> = {};
    let shouldSyncGroup: any = null;

    // 1. chat_join_request
    if (u.chat_join_request && u.chat_join_request.chat) {
      const jr = u.chat_join_request;
      const chat = jr.chat;
      const user = jr.from;

      if (autoApprove) {
        await fetch(
          `https://api.telegram.org/bot${token}/approveChatJoinRequest?chat_id=${chat.id}&user_id=${user.id}`,
          { method: "POST", signal: AbortSignal.timeout(4000) }
        ).catch(() => {});
      } else {
        await PendingJoin.findOneAndUpdate(
          { userId: user.id, chatId: chat.id },
          {
            userId: user.id,
            chatId: chat.id,
            userName: user.first_name || "",
            timestamp: Date.now(),
          },
          { upsert: true }
        );
      }

      rawJoinsToAdd.push({
        userId: user.id,
        userName:
          (user.first_name || "") + (user.last_name ? ` ${user.last_name}` : ""),
        chatId: chat.id,
        chatTitle: chat.title || "Group",
        timestamp: jr.date ? jr.date * 1000 : Date.now(),
        is_bot: user.is_bot || false,
      });
      shouldSyncGroup = chat;
    }

    // 2. my_chat_member
    if (u.my_chat_member && u.my_chat_member.chat) {
      const myMu = u.my_chat_member;
      const chat = myMu.chat;
      const newStatus = myMu.new_chat_member?.status;
      if (["member", "administrator", "creator", "restricted"].includes(newStatus)) {
        shouldSyncGroup = chat;
      } else if (["left", "kicked"].includes(newStatus)) {
        await Group.deleteOne({ id: String(chat.id) });
      }
    }

    // 3. chat_member
    if (u.chat_member && u.chat_member.chat) {
      const mu = u.chat_member;
      const chat = mu.chat;
      const chatIdStr = String(chat.id);
      const oldStatus = mu.old_chat_member?.status;
      const newStatus = mu.new_chat_member?.status;

      const isMemberNow = ["member", "administrator", "creator", "restricted"].includes(
        newStatus
      );
      const wasMemberBefore = [
        "member",
        "administrator",
        "creator",
        "restricted",
      ].includes(oldStatus);

      if (isMemberNow && !wasMemberBefore) {
        const user = mu.new_chat_member.user;
        rawJoinsToAdd.push({
          userId: user.id,
          userName:
            (user.first_name || "") + (user.last_name ? ` ${user.last_name}` : ""),
          chatId: chat.id,
          chatTitle: chat.title || "Group",
          timestamp: mu.date ? mu.date * 1000 : Date.now(),
          is_bot: user.is_bot || false,
        });
        shouldSyncGroup = chat;
      } else if (!isMemberNow && wasMemberBefore) {
        memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) - 1;
        shouldSyncGroup = chat;
      }
    }

    // 4. message / channel_post
    const msg = u.message || u.channel_post;
    if (msg && msg.chat) {
      const chat = msg.chat;
      const chatIdStr = String(chat.id);
      shouldSyncGroup = chat;

      if (Array.isArray(msg.new_chat_members)) {
        for (const newUser of msg.new_chat_members) {
          rawJoinsToAdd.push({
            userId: newUser.id,
            userName:
              (newUser.first_name || "") +
              (newUser.last_name ? ` ${newUser.last_name}` : ""),
            chatId: chat.id,
            chatTitle: chat.title || "Group",
            timestamp: msg.date ? msg.date * 1000 : Date.now(),
            is_bot: newUser.is_bot || false,
          });
        }
      }

      if (msg.left_chat_member) {
        memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) - 1;
      }

      if (autoClean && (msg.new_chat_members || msg.left_chat_member)) {
        await fetch(
          `https://api.telegram.org/bot${token}/deleteMessage?chat_id=${chat.id}&message_id=${msg.message_id}`,
          { method: "POST", signal: AbortSignal.timeout(3000) }
        ).catch(() => {});
      }

      if (msg.new_chat_title) {
        await Group.findOneAndUpdate(
          { id: chatIdStr },
          { name: msg.new_chat_title },
          { upsert: false }
        );
      }
    }

    // Sync Group info
    if (
      shouldSyncGroup &&
      ["group", "supergroup", "channel"].includes(shouldSyncGroup.type)
    ) {
      const chatIdStr = String(shouldSyncGroup.id);
      const groupExists = await Group.findOne({ id: chatIdStr });
      if (!groupExists) {
        let memberCount = 0;
        try {
          const countRes = await fetch(
            `https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${chatIdStr}`,
            { signal: AbortSignal.timeout(3000) }
          );
          const countData: any = await countRes.json();
          if (countData.ok) memberCount = countData.result;
        } catch {
          // ignore
        }

        await Group.create({
          id: chatIdStr,
          name: shouldSyncGroup.title || "Unknown",
          memberCount,
          description: shouldSyncGroup.description || "Auto Discovered Hub",
          category: "Telegram",
          image: `https://picsum.photos/seed/${chatIdStr}/200`,
          lastInteraction: Date.now(),
          interactionCount: 1,
          createdAt: Date.now(),
        });
      } else {
        await Group.findOneAndUpdate(
          { id: chatIdStr },
          {
            $set: { lastInteraction: Date.now() },
            $inc: { interactionCount: 1 },
          }
        );
      }
    }

    // Deduplicate & store joins immediately (always complete DB write before responding)
    const botSettingsDoc = await BotSettings.findOne({ key: "default" }).lean();

    for (const ev of rawJoinsToAdd) {
      const cutoffLower = ev.timestamp - 120000;
      const cutoffUpper = ev.timestamp + 120000;
      const existing = await JoinEvent.findOne({
        userId: ev.userId,
        chatId: ev.chatId,
        timestamp: { $gt: cutoffLower, $lt: cutoffUpper },
      });

      if (!existing) {
        await JoinEvent.create({
          userId: ev.userId,
          userName: ev.userName || `User ${ev.userId}`,
          chatId: ev.chatId,
          chatTitle: ev.chatTitle || "Group",
          timestamp: ev.timestamp,
        });

        const cidStr = String(ev.chatId);
        memberChanges[cidStr] = (memberChanges[cidStr] || 0) + 1;
        const grpDoc = await Group.findOne({ id: cidStr }).lean();

        // Custom Per-Batch or Global Welcome Message
        const batchWelcome = grpDoc?.welcomeConfig;
        const shouldSendWelcome =
          !ev.is_bot &&
          (batchWelcome?.enabled === true || (autoWelcome && batchWelcome?.enabled !== false));

        if (shouldSendWelcome) {
          const escapedName = escapeHtml(ev.userName || "Awesome Member");
          const escapedGroup = escapeHtml(ev.chatTitle || grpDoc?.name || "Hub");
          const mentionHtml = `<a href="tg://user?id=${ev.userId}"><b>${escapedName}</b></a>`;

          let text = "";
          if (batchWelcome?.text && batchWelcome.text.trim()) {
            text = escapeHtml(batchWelcome.text.trim())
              .replace(/\{\{name\}\}/gi, mentionHtml)
              .replace(/\{\{group\}\}/gi, `<b>${escapedGroup}</b>`);
          } else if (botSettingsDoc?.welcomeEnabled && botSettingsDoc?.welcomeMessage?.trim()) {
            text = escapeHtml(botSettingsDoc.welcomeMessage.trim())
              .replace(/\{\{name\}\}/gi, mentionHtml)
              .replace(/\{\{group\}\}/gi, `<b>${escapedGroup}</b>`);
          } else {
            text = `🎉 <b>Welcome to ${escapedGroup}!</b> 🎉\n\nHey ${mentionHtml}, we're thrilled to have you here! ✨\n\n<i>Enjoy your stay, and keep it friendly!</i> 🚀`;
          }

          const replyMarkup =
            batchWelcome?.buttonText?.trim() && isValidHttpUrl(batchWelcome?.buttonUrl)
              ? {
                  inline_keyboard: [
                    [{ text: batchWelcome.buttonText.trim().slice(0, 64), url: batchWelcome.buttonUrl.trim() }],
                  ],
                }
              : undefined;

          const hasPhoto = isValidHttpUrl(batchWelcome?.photoUrl);
          const endpoint = hasPhoto ? "sendPhoto" : "sendMessage";
          const payload: Record<string, any> = hasPhoto
            ? {
                chat_id: ev.chatId,
                photo: batchWelcome.photoUrl.trim(),
                caption: text.slice(0, 1024),
                parse_mode: "HTML",
                ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
              }
            : {
                chat_id: ev.chatId,
                text: text.slice(0, 4096),
                parse_mode: "HTML",
                ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
              };

          await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(3500),
          }).catch(() => {});
        }

        // Instant Telegram Admin DM Alerts (complete cleanly before serverless response returns)
        const adminChatId = botSettingsDoc?.adminAlertChatId?.trim();
        if (adminChatId && !ev.is_bot) {
          if (botSettingsDoc?.alertOnJoin) {
            const alertText =
              `🟢 <b>New Member Joined</b>\n\n` +
              `👤 <b>User:</b> ${escapeHtml(ev.userName || `User ${ev.userId}`)} (<code>${ev.userId}</code>)\n` +
              `📌 <b>Hub:</b> ${escapeHtml(ev.chatTitle || grpDoc?.name || cidStr)}\n` +
              `🕒 <b>Time:</b> ${new Date(ev.timestamp).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })} IST`;
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: adminChatId, text: alertText, parse_mode: "HTML" }),
              signal: AbortSignal.timeout(3000),
            }).catch(() => {});
          }

          if (botSettingsDoc?.alertOnSuspicious) {
            const recentSameUser = await JoinEvent.find({
              userId: ev.userId,
              timestamp: { $gte: Date.now() - 86400000 },
            }).lean();
            const distinctHubs = new Set(recentSameUser.map((r: any) => String(r.chatId)));
            if (distinctHubs.size >= 2) {
              const susText =
                `⚠️ <b>Multi-Hub Join Alert</b>\n\n` +
                `👤 <b>User:</b> ${escapeHtml(ev.userName || `User ${ev.userId}`)} (<code>${ev.userId}</code>)\n` +
                `🔁 Joined <b>${distinctHubs.size} different hubs</b> in the last 24h (latest: ${escapeHtml(ev.chatTitle || cidStr)}).`;
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: adminChatId, text: susText, parse_mode: "HTML" }),
                signal: AbortSignal.timeout(3000),
              }).catch(() => {});
            }
          }
        }
      }
    }

    for (const [cid, diff] of Object.entries(memberChanges)) {
      if (diff !== 0) {
        await Group.findOneAndUpdate({ id: cid }, { $inc: { memberCount: diff } });
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook route error:", err);
    res.status(200).json({ ok: true });
  }
});

export default app;
