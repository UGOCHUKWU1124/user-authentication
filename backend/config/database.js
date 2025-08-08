import mongoose from "mongoose"

export const connectdatabase = async ()=>{
    try{
        const connection = await mongoose.connect(process.env.MONGO_URL)
        console.log( `Database connected successfully: ${connection.connection.host}`)
    }
    catch(error){
        console.log("Error connecting to MongoDB:", error.message);
        process.exit(1);// Exit process with failure
    }
}