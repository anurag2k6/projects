const mongoose = require('mongoose');

// Stores information when a user registers for a specific event
const registrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  college: { type: String, required: true },
  branch: { type: String, required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  createdAt: { type: Date, default: Date.now },
  teamName: { type: String },
  teamMembers: [{ type: String }],
});

module.exports = mongoose.model('Registration', registrationSchema);
