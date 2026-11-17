const mongoose = require("mongoose")
const dns = require("dns")

// node on windows can fall back to 127.0.0.1 for dns, which breaks mongodb+srv lookups
if (process.platform === "win32") dns.setServers(["8.8.8.8", "1.1.1.1"])

async function connectToDB(){ //connection to the database
    try{
        const connection = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`Connected to Database: ${connection.connection.name}`);
    }
    catch(error){
        console.error("Failed to connect to MongoDB:", error.message)
        process.exit(1) // crash so the deploy fails loudly instead of returning 500s
    }
}

module.exports = connectToDB