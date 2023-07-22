require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

//Define Mongoose Schemas
const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const userSchema = new mongoose.Schema({
  username: { type: String },
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean
});


//Define mongoose models
const Admin = mongoose.model('Admin', adminSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

//Connect to MongoDB
mongoose.connect('mongodb+srv://mahesh_a:adAG6ZWfkCm9r3aH@cluster0.wb7pze3.mongodb.net/courses', { useNewUrlParser: true, useUnifiedTopology: true/*, dbName: "courses"*/ });


/* function generateJwt(user){
  const payload = { username: user.username };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
} */

const authenticateAdminJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  const token = authHeader && authHeader.split(' ')[1]; //First checks authHeader. If it is not present we get undefined
  if(token === undefined || token === '')  return res.status(401).json({ message: 'No Token is present' })

  jwt.verify(token, process.env.ADMIN_ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.status(403).json({ message: 'Invalid Token' })
    
    req.user = user;
    next();
  });
}

const authenticateUserJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; //First checks authHeader. If it is not present we get undefined
  if(token === undefined || token === '')  return res.status(401).json({ message: 'No Token is present' })

  jwt.verify(token, process.env.USER_ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.status(403).json({ message: 'Invalid Token' })
    
    req.user = user;
    next();
  });
}


// Admin routes
app.post('/admin/signup', async (req, res) => {// logic to sign up admin
  let { username, password } = req.body;
  let adminCheck = await Admin.findOne({ username })
  
  if(adminCheck){
    res.status(400).json({ message: "Admin's username provied is already registered" });
  }else{
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    
    const accessToken = jwt.sign({ username, role: "admin" }, process.env.ADMIN_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    return res.status(201).json({ message: 'Admin created successfully', accessToken });
  }
  
});


app.post('/admin/login', async (req, res) => {// logic to log in admin
  let { username, password } = req.headers;

  let admin = await Admin.findOne({ username, password });
  if(admin){
    const accessToken = jwt.sign({ username, role: "admin" }, process.env.ADMIN_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    return res.json({ message: 'Logged in successfully', accessToken });
  }

  res.status(401).json({ message: 'Invalid Admin Credentials' });
});

app.get('/admin/profile', authenticateAdminJwt, async (req, res) => {// logic to get Admin Profile details
  return res.json({username: req.user.username, role: req.user.role});
});

app.post('/admin/courses', authenticateAdminJwt, async (req, res) => {// logic to create a course
    let { title } = req.body;
    //let courseCheck = await Course.findOne({ title: req.body.title });
    let courseCheck = await Course.findOne({ title });

    if(courseCheck){
      return res.status(400).json({ message: 'Course with this title is already added' })
    }else{
      const course = new Course(req.body);
      await course.save();

      return res.status(201).json({ message: 'Course created successfully', courseId: course.id }); 
    }
});

app.put('/admin/courses/:courseId', authenticateAdminJwt, async (req, res) => {// logic to edit a course
    try{
      let course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true });
      if(course){
        return res.json({ message: 'Course updated successfully' });
      }else{
        return res.status(400).json({ message: 'Course with the course Id does not exist' });
      }
    }catch (error){
      console.error(error);
      res.status(400).json({ message: "Error Updating" });
    }
});

app.get('/admin/courses', authenticateAdminJwt, async (req, res) => {// logic to get all courses

  const courses = await Course.find({});
  return res.json({ courses: courses });
});

app.get('/admin/courses/:courseId', authenticateAdminJwt, async (req, res) => {// logic to get a course
  let course = await Course.findById(req.params.courseId);

  if(course){
    return res.json({ course });
  }else{
    return res.status(404).json({ message: 'Course ID does not Exist' })
  }

});

// User routes
app.post('/users/signup', async (req, res) => {// logic to sign up user
  let { username, password } = req.body;
  let userCheck = await User.findOne({ username });
  
  if(userCheck){
    res.status(400).json({ message: "User's username provied is already registered" });
  }else{
    const user = new User({ username, password });
    await user.save();

    const accessToken = jwt.sign({ username, role: 'user' }, process.env.USER_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    return res.status(201).json({ message: 'User created successfully', accessToken });
  }
});

app.post('/users/login', async (req, res) => {// logic to log in user
  let { username, password } = req.headers;

  let user = await User.findOne({ username, password });
 
  if(user){
    const accessToken = jwt.sign({ username, role: 'user' }, process.env.USER_ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    return res.json({ message: 'Logged in successfully', accessToken });
  }
  res.status(401).json({ message: 'Invalid User Credentials'});
});

app.get('/users/courses', authenticateUserJwt, async (req, res) => {// logic to list all courses
  const courses = await Course.find({ published: true });
  
  return res.json({ courses: courses });
});

app.post('/users/courses/:courseId', authenticateUserJwt, async (req, res) => {// logic to purchase a course
  let course = await Course.findOne({ _id: req.params.courseId, published: true });
  if(course) {
    let user = await User.findOne({ username: req.user.username });
    if(user){
      let usersPurchasedCoursesCheck = user.purchasedCourses.includes(req.params.courseId);
      if (usersPurchasedCoursesCheck) {
        return res.status(400).json({ message: 'This Course is already purchased' });
      } else {
        user.purchasedCourses.push(course);
        await user.save();
        return res.json({ message: 'Course purchased successfully' });
        
      }
    }else{
      return res.status(403).json({ message: 'User not Found' });
    }
  }else{
    return res.status(404).send({ message: 'Course with the course Id does not exist to Purchase or it is not yet published' });
  }
  
});

app.get('/users/purchasedCourses', authenticateUserJwt, async (req, res) => {
  let user = await User.findOne({ username: req.user.username }).populate('purchasedCourses');
  if(user && user.purchasedCourses){
    return res.json({ purchasedCourses: user.purchasedCourses });
  }else{
    return res.status(404).json({ purchasedCourses: "No Purchased Courses" });
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});