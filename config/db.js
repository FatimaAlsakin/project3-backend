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
        console.log("Error Occured",error)
    }
}

module.exports = connectToDB