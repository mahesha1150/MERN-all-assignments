const mongoose = require("mongoose");

//Define Mongoose Schemas
const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});

const userSchema = new mongoose.Schema({
    username: { type: String },
    password: String,
    userrole: String,
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    imageLink: String,
    published: Boolean
});

const purchasedCoursesSchema = new mongoose.Schema({
    username: String,
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
})


//Define mongoose models
const Admin = mongoose.model('Admin', adminSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const PurchasedCourses = mongoose.model('PurchasedCourses', purchasedCoursesSchema);

module.exports = {
    Admin,
    User,
    Course,
    PurchasedCourses
  }