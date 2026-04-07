const mongoose = require('mongoose');

// Schema for storing registered users
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
});

module.exports = mongoose.model('User', userSchema);
