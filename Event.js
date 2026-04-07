const mongoose = require('mongoose');

// Schema representing an event that users can register for
const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed'],
    default: 'Upcoming',
  },
  seats: { type: Number, required: true, min: 0, default: 100 },
  seatsBooked: { type: Number, required: true, min: 0, default: 0 },
  image: { type: String, default: 'https://via.placeholder.com/350x180?text=Event+Poster' },
  eventType: {
    type: String,
    enum: ['Single', 'Team', 'Both'],
    default: 'Single',
  },
  teamSize: { type: Number, min: 1, default: 1 },
  rules: { type: String, default: '' },
});

// virtual value for seats remaining
eventSchema.virtual('seatsRemaining').get(function () {
  return Math.max(0, this.seats - this.seatsBooked);
});

eventSchema.set('toJSON', { virtuals: true });

eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
