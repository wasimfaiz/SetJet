import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cron from "node-cron";
import { getDueReminders } from "./app/lib/reminders.js";
import { sendEmailOrPush } from "./app/lib/notifications.js";
import { getEmployeeById } from "./app/lib/employee.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://europass-admin.vercel.app",
      "https://admin.yastudy.com"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  socket.on("join", (roomId) => {
    console.log(`📦 ${socket.id} joined room ${roomId}`);
    socket.join(roomId);
  });
});

app.post("/emit-task-event", (req, res) => {
  const { event, room, data } = req.body;

  if (!room) return res.status(400).json({ error: "Room required" });

  io.to(room).emit(event, data);
  return res.json({ success: true });
});


cron.schedule("* * * * *", async () => {
  console.log("🕒 Checking due reminders...");
  try {
    const reminders = await getDueReminders();
    console.log(`🔔 ${reminders.length} due`);

    for (const reminder of reminders) {
      // Emit via Socket.IO
      io.to(reminder.employeeId).emit("reminderFired", reminder);
      console.log("📤 Emitted to socket room:", reminder.employeeId);

      // ✅ Fetch employee phone number
      const employee = await getEmployeeById(reminder.employeeId);
      const phoneNumber = employee?.basicField?.phoneNumber;

      if (phoneNumber) {
        await sendEmailOrPush({
          ...reminder,
          phoneNumber, // override/add phoneNumber from DB
        });
      } else {
        console.warn(`⚠️ No phone number found for employee ${reminder.employeeId}`);
      }
    }

    console.log("✅ Done");
  } catch (err) {
    console.error("❌ Cron Error:", err);
  }
});

server.listen(5000, () => {
  console.log("🚀 Socket server running on port 5000");
});
