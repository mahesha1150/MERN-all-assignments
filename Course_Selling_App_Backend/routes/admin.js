const express = require('express');
const { Admin, Course } = require("../db");
const jwt = require('jsonwebtoken');
//const { SECRET } = require("../middleware/auth")
const { authenticateAdminJwt } = require("../middleware/auth");

const router = express.Router();

// Admin routes
router.post('/signup', async (req, res) => {// logic to sign up admin
    let { username, password } = req.body;
    let adminCheck = await Admin.findOne({ username })

    if (adminCheck) {
        res.status(400).json({ message: "Admin's username provied is already registered" });
    } else {
        const newAdmin = new Admin({ username, password });
        await newAdmin.save();

        const accessToken = jwt.sign({ username, role: "admin" }, process.env.ADMIN_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        return res.status(201).json({ message: 'Admin created successfully', accessToken });
    }

});


router.post('/login', async (req, res) => {// logic to log in admin
    let { username, password } = req.headers;

    let admin = await Admin.findOne({ username, password });
    if (admin) {
        const accessToken = jwt.sign({ username, role: "admin" }, process.env.ADMIN_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        return res.json({ message: 'Logged in successfully', accessToken });
    }

    res.status(401).json({ message: 'Invalid Admin Credentials' });
});

router.get('/profile', authenticateAdminJwt, async (req, res) => {// logic to get Admin Profile details
    return res.json({ username: req.user.username, role: req.user.role });
});

router.post('/courses', authenticateAdminJwt, async (req, res) => {// logic to create a course
    let { title } = req.body;
    //let courseCheck = await Course.findOne({ title: req.body.title });
    let courseCheck = await Course.findOne({ title });

    if (courseCheck) {
        return res.status(400).json({ message: 'Course with this title is already added' })
    } else {
        const course = new Course(req.body);
        await course.save();

        return res.status(201).json({ message: 'Course created successfully', courseId: course.id });
    }
});

router.put('/courses/:courseId', authenticateAdminJwt, async (req, res) => {// logic to edit a course
    try {
        let course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true });
        if (course) {
            return res.json({ message: 'Course updated successfully' });
        } else {
            return res.status(400).json({ message: 'Course with the course Id does not exist' });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error Updating" });
    }
});

router.get('/courses', authenticateAdminJwt, async (req, res) => {// logic to get all courses

    const courses = await Course.find({});
    return res.json({ courses: courses });
});

router.get('/courses/:courseId', authenticateAdminJwt, async (req, res) => {// logic to get a course
    let course = await Course.findById(req.params.courseId);

    if (course) {
        return res.json({ course });
    } else {
        return res.status(404).json({ message: 'Course ID does not Exist' })
    }

});


module.exports = router