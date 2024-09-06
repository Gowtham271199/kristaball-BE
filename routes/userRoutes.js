const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Register Route
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log("Signup request received:", req.body);

        let user = await User.findOne({ username });
        if (user) {
            console.log("User already exists");
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            username,
            password,
        });

        await user.save();
        console.log("User saved successfully");

        const payload = { userId: user._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'jwtSecret', { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send('Server error');
    }
});



// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = { userId: user._id };
        const token = jwt.sign(payload, 'jwtSecret', { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Profile Route (protected)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Update Profile Route (protected)
router.put('/profile', authMiddleware, async (req, res) => {
    const { age, dob, contact } = req.body;

    try {
        let user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.age = age || user.age;
        user.dob = dob || user.dob;
        user.contact = contact || user.contact;

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
