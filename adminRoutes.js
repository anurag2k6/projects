const express = require('express');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

const router = express.Router();

// hardcoded admin credentials for simplicity
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const ADMIN_TOKEN = 'admin-token-2026';

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized admin access' });
  }
  next();
}

/**
 * @route   POST /api/admin/login
 * @desc    Validate admin credentials
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ message: 'Login successful', token: ADMIN_TOKEN });
  }
  return res.status(401).json({ message: 'Invalid admin credentials' });
});

/**
 * @route   POST /api/admin/events
 * @desc    Add a new event
 */
router.post('/events', requireAdmin, async (req, res) => {
  try {
    const { name, date, time, location, status, seats, image, eventType, teamSize, rules } = req.body;

    if (!name || !date || !time || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const event = new Event({
      name,
      date,
      time,
      location,
      status: status || 'Upcoming',
      seats: seats != null ? Number(seats) : 100,
      image: image || undefined,
      eventType: eventType || 'Single',
      teamSize: teamSize != null ? Number(teamSize) : 1,
      rules: rules || '',
    });

    await event.save();
    res.status(201).json({ message: 'Event added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/events
 * @desc    Get all events (including completed)
 */
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/admin/events/:id
 * @desc    Edit an event
 */
router.put('/events/:id', requireAdmin, async (req, res) => {
  try {
    const { name, date, time, location, status, seats, image, eventType, teamSize, rules } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.name = name || event.name;
    event.date = date || event.date;
    event.time = time || event.time;
    event.location = location || event.location;
    event.status = status || event.status;
    event.seats = seats != null ? Number(seats) : event.seats;
    event.image = image !== undefined ? image : event.image;
    event.eventType = eventType || event.eventType;
    event.teamSize = teamSize != null ? Number(teamSize) : event.teamSize;
    event.rules = rules !== undefined ? rules : event.rules;

    await event.save();
    res.json({ message: 'Event updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/admin/events/:id
 * @desc    Delete event by id
 */
router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await Registration.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/registrations
 * @desc    Return all registrations with event populated
 */
router.get('/registrations', requireAdmin, async (req, res) => {
  try {
    const regs = await Registration.find().populate('event');
    res.json(regs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    Summary data for admin
 */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRegistrations = await Registration.countDocuments();

    res.json({ totalEvents, totalUsers, totalRegistrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/admin/auto-complete-events
 * @desc    Mark events as completed if their date has passed
 */
router.post('/auto-complete-events', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const result = await Event.updateMany(
      { date: { $lt: now }, status: { $ne: 'Completed' } },
      { status: 'Completed' }
    );
    res.json({ message: `${result.modifiedCount} events marked as completed` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
