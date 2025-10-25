const mongoose=require("mongoose");
const bcrypt =require("bcryptjs");
const jwt =require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        nom: {
            type:String,
            required:[true,"le nom est obligatoire"],
            trim: true,
            minlength:[2,"le nom doit contenir au moin 2 caractères"]
        },
        email: {
            type:String, 
            required: [true,"L'email est obligatire"],
            unique:true,
            match:[/^\S+@\S+\.\S+$/,"Email invalide"],
        },
        password:{
            type:String,
            required:[true,"le mot de passe est obligatoire"],
            minlength:[6,"le mot de passe doit contenir au moins 6 caractères"],
        },
        role:{
            type:String,
            enum:["admin","client"],
            default:"client",
        },
    },
    {timestamps:true}
);

// 🔒 Avant de sauvegarder : hasher le mot de passe
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // si pas modifié, ne pas re-hasher
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧠 Méthode : comparer le mot de passe
userSchema.methods.comparePassword = async function (passwordEntré) {
  return await bcrypt.compare(passwordEntré, this.password);
};

// 🔑 Méthode : générer un token JWT
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "1d" } // token valide 1 jour
  );
};

module.exports= mongoose.model("User",userSchema);