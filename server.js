// imports
const connectToDB = require('./config/db.js')
const express = require("express") //importing express package
const app = express() // creates a express application
const dotenv = require("dotenv").config() //this allows me to use my .env values in this file
const morgan = require('morgan')
const cors = require('cors')

const http = require("http");
const { Server } = require("socket.io");
const registerSocketHandlers = require("./socket");
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];
 
// Create HTTP server
const httpServer = http.createServer(app);

// Attach Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },

  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false,
  },
});

// Routes Import
const authRoutes = require('./routes/auth.routes')
const caseRoutes = require('./routes/case.routes')
const teamRoutes = require("./routes/team.routes.js")
const evidenceRoutes = require("./routes/evidence.routes.js")
const noteRoutes=require("./routes/note.router.js")
const sloveAttemptsRoutes= require("./routes/solve.routes.js")
const chatRoutes = require("./routes/chat.routes.js")
const boardRoutes = require("./routes/board.routes.js")
const liveRoutes = require("./routes/live.routes.js")

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
    })
);
app.use(express.json())
app.use(morgan('dev'))

// Make io available inside controllers
app.set("io", io);

// Register socket events
registerSocketHandlers(io);

// Routes
app.use('/auth',authRoutes)
app.use('/cases',caseRoutes)
app.use("/teams", teamRoutes)
app.use("/evidence", evidenceRoutes)
app.use("/note",noteRoutes)
app.use("/solve",sloveAttemptsRoutes)
app.use("/chat", chatRoutes)
app.use("/board", boardRoutes)
app.use("/live", liveRoutes)

// Catch errors thrown by middleware (e.g. image uploads to Cloudinary) and send them as JSON
app.use((err, req, res, next) => {
    console.log(err)
    res.status(err.http_code || err.status || 500).json({ message: err.message || "Image upload failed" })
})

// connect to database and listen on Port 3000
async function startServer() {
    const PORT = process.env.PORT || 3000;
    await connectToDB();

    httpServer.listen(PORT, () => {
        console.log(`App is running on port ${PORT}`);
    });
}
startServer();