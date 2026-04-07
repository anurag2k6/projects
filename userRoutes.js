const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user credentials
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/events
 * @desc    Fetch events (non-completed by default)
 * @access  Public
 */
router.get('/events', async (req, res) => {
  try {
    let query = {};
    if (!req.query.all) {
      query.status = { $ne: 'Completed' };
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/events/:id
 * @desc    Fetch a single event by ID
 * @access  Public
 */
router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/users/events/:id/register
 * @desc    Register a user for an event
 * @access  Public
 */
router.post('/events/:id/register', async (req, res) => {
  try {
    const { name, email, college, branch, userId, teamName, teamMembers } = req.body;

    if (!name || !email || !college || !branch) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot register for completed event' });
    }

    if (event.seatsBooked >= event.seats) {
      return res.status(400).json({ message: 'Event is fully booked' });
    }

    // For team events, validate team fields
    if (event.eventType === 'Team' || event.eventType === 'Both') {
      if (!teamName || !teamMembers || teamMembers.length !== event.teamSize - 1) {
        return res.status(400).json({ message: `Team name and ${event.teamSize - 1} team members required` });
      }
    }

    const duplicate = await Registration.findOne({ email, event: event._id });
    if (duplicate) {
      return res.status(400).json({ message: 'You have already registered for this event' });
    }

    const registration = new Registration({
      user: userId || null,
      name,
      email,
      college,
      branch,
      event: event._id,
      teamName: teamName || null,
      teamMembers: teamMembers || [],
    });
    await registration.save();

    event.seatsBooked += 1;
    if (event.seatsBooked >= event.seats) event.seatsBooked = event.seats;
    await event.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/registrations
 * @desc    Get registrations for a user by email
 * @access  Public
 */
router.get('/registrations', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const registrations = await Registration.find({ email }).populate('event');
    res.json(registrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
