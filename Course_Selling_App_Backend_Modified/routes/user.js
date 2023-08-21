const express = require('express');
const { User, Course, PurchasedCourses } = require("../db");
const jwt = require('jsonwebtoken');
//const { SECRET } = require("../middleware/auth")
const { authenticateUserJwt } = require("../middleware/auth");

const router = express.Router();

// User routes
router.post('/signup', async (req, res) => {// logic to sign up user
    let { fullname, username, password, userimage } = req.body;
    let userCheck = await User.findOne({ username });

    if (userCheck) {
        res.status(400).json({ message: "User's email provied is already registered" });
    } else {
        const userrole = "user";
        const user = new User({ fullname, username, password, userrole, userimage });
        await user.save();

        const accessToken = jwt.sign({ username, userrole: 'user' }, process.env.USER_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        return res.status(201).json({ message: 'User created successfully', accessToken });
    }
});

router.post('/login', async (req, res) => {// logic to log in user
    let { username, password } = req.headers;

    let user = await User.findOne({ username, password });
    if (user) {
        const accessToken = jwt.sign({ fullname: user.fullname, username, userrole: user.userrole }, process.env.USER_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        return res.json({ message: 'Logged in successfully', accessToken, userrole: user.userrole, userimage: user.userimage });
    }
    res.status(401).json({ message: 'Invalid User Credentials' });
});

router.get('/profile', authenticateUserJwt, async (req, res) => {// logic to get User Profile details
    return res.json({ fullname: req.user.fullname, username: req.user.username, userrole: req.user.userrole });
});

router.get('/courses', authenticateUserJwt, async (req, res) => {// logic to list all courses which are published
    let courses = await Course.find({ published: true }); //Users list only Published Courses
    let purchasedCourses = await PurchasedCourses.find({ username: req.user.username });
    courses = courses.map(course => {
        const isPurchased = purchasedCourses.some(purchasedCourse =>
            purchasedCourse.purchasedCourses.includes(course._id)
        );

        return { ...course.toObject(), purchasedCourseCheck: isPurchased };
    });
    return res.json({ courses: courses });
});

/* router.get('/courses/:courseId', authenticateUserJwt, async (req, res) => {// logic to get a course
    let course = await Course.findById(req.params.courseId);

    if (course) {
        return res.json({ course });
    } else {
        return res.status(404).json({ message: 'Course ID does not Exist' })
    }

}); */

router.post('/courses/:courseId', authenticateUserJwt, async (req, res) => {// logic to purchase a course
    let course = await Course.findOne({ _id: req.params.courseId, published: true });
    try {
        if (course) {
            let user = await User.findOne({ username: req.user.username });
            if (user) {
                let userPurchasedCourses = await PurchasedCourses.findOne({ username: req.user.username });
                if (!userPurchasedCourses) {
                    const newPurchasedCoursesUser = new PurchasedCourses({ username: req.user.username, purchasedCourses: course });
                    await newPurchasedCoursesUser.save();
                } else {
                    let usersPurchasedCoursesCheck = userPurchasedCourses.purchasedCourses.includes(req.params.courseId);
                    if (usersPurchasedCoursesCheck) {
                        return res.status(400).json({ message: 'This Course is already purchased' });
                    }
                    userPurchasedCourses.purchasedCourses.push(course)
                    await userPurchasedCourses.save();
                }
                return res.json({ message: 'Course purchased successfully', courseId: req.params.courseId });

                /* let usersPurchasedCoursesCheck = user.purchasedCourses.includes(req.params.courseId);
                if (usersPurchasedCoursesCheck) {
                    return res.status(400).json({ message: 'This Course is already purchased' });
                } else {
                    user.purchasedCourses.push(course);
                    await user.save();
                    return res.json({ message: 'Course purchased successfully', courseId: req.params.courseId });
                } */
            } else {
                return res.status(403).json({ message: 'User not Found' });
            }
        } else {
            return res.status(404).send({ message: 'Course with the course Id does not exist to Purchase or it is not yet published' });
        }
    } catch (err) {
        console.error('Error Purchasing course:', err);
    }

});

router.get('/purchasedCourses', authenticateUserJwt, async (req, res) => {// logic to list all purchased courses
    let user = await PurchasedCourses.findOne({ username: req.user.username }).populate('purchasedCourses');
    if (user && user.purchasedCourses) {
        const purchasedCourses = user.purchasedCourses.map(course => ({
            ...course.toObject(),
            purchasedCourseCheck: true
        }));
        return res.json({ purchasedCourses });
    } else {
        return res.status(404).json({});
    }
});


module.exports = router