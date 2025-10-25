const mongoose=require("mongoose");

//fonction pour connecter MongoDB
const connectDB=async () =>{
    try {
        const conn= await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB connecté:${conn.connection.host}`);
    }catch(error){
        console.error(`Erreur de connexion MongoDB:${error.message}`);
        process.exit(1);//stoppe l'application si echec de connexion
    }
};

module.exports = connectDB;