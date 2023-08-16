const express = require('express');
const { User, Course } = require("../db");
const jwt = require('jsonwebtoken');
//const { SECRET } = require("../middleware/auth")
const { authenticateUserJwt } = require("../middleware/auth");

const router = express.Router();

// User routes
router.post('/signup', async (req, res) => {// logic to sign up user
    let { username, password } = req.body;
    let userCheck = await User.findOne({ username });

    if (userCheck) {
        res.status(400).json({ message: "User's username provied is already registered" });
    } else {
        const userrole = "user";
        const user = new User({ username, password, userrole });
        await user.save();

        const accessToken = jwt.sign({ username, userrole: 'user' }, process.env.USER_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        return res.status(201).json({ message: 'User created successfully', accessToken });
    }
});

router.post('/login', async (req, res) => {// logic to log in user
    let { username, password } = req.headers;

    let user = await User.findOne({ username, password });
    if (user) {
        const accessToken = jwt.sign({ username, userrole: user.userrole }, process.env.USER_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        return res.json({ message: 'Logged in successfully', accessToken, userrole: user.userrole });
    }
    res.status(401).json({ message: 'Invalid User Credentials' });
});

router.get('/profile', authenticateUserJwt, async (req, res) => {// logic to get User Profile details
    return res.json({ username: req.user.username, userrole: req.user.userrole });
});

router.post('/courses', authenticateUserJwt, async (req, res) => {// logic to create a course
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

router.get('/courses', authenticateUserJwt, async (req, res) => {// logic to list all courses
    let courses = null;
    if(req.user.userrole === "admin"){ //Admin List all the courses
        courses = await Course.find({});
    }else{
        courses = await Course.find({ published: true }); //Users list only Published Courses
    }

    return res.json({ courses: courses });
});

router.get('/courses/:courseId', authenticateUserJwt, async (req, res) => {// logic to get a course
    let course = await Course.findById(req.params.courseId);

    if (course) {
        return res.json({ course });
    } else {
        return res.status(404).json({ message: 'Course ID does not Exist' })
    }

});

router.put('/courses/:courseId', authenticateUserJwt, async (req, res) => {// logic to edit a course
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

router.post('/courses/:courseId', authenticateUserJwt, async (req, res) => {// logic to purchase a course
    let course = await Course.findOne({ _id: req.params.courseId, published: true });
    if (course) {
        let user = await User.findOne({ username: req.user.username });
        if (user) {
            let usersPurchasedCoursesCheck = user.purchasedCourses.includes(req.params.courseId);
            if (usersPurchasedCoursesCheck) {
                return res.status(400).json({ message: 'This Course is already purchased' });
            } else {
                user.purchasedCourses.push(course);
                await user.save();
                return res.json({ message: 'Course purchased successfully' });

            }
        } else {
            return res.status(403).json({ message: 'User not Found' });
        }
    } else {
        return res.status(404).send({ message: 'Course with the course Id does not exist to Purchase or it is not yet published' });
    }

});

router.get('/purchasedCourses', authenticateUserJwt, async (req, res) => {
    let user = await User.findOne({ username: req.user.username }).populate('purchasedCourses');
    if (user && user.purchasedCourses) {
        return res.json({ purchasedCourses: user.purchasedCourses });
    } else {
        return res.status(404).json({ purchasedCourses: "No Purchased Courses" });
    }
});


module.exports = router