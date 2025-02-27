require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];


function generateJwt(user){
  const payload = { username: user.username };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
}

const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; //First checks authHeader. If it is not present we get undefined
  if(token === undefined || token === '')  return res.status(401).json({ message: 'No Token is present' })

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.status(403).json({ message: 'Invalid Token' })
    
    req.user = user;
    next();
  });

}


// Admin routes
app.post('/admin/signup', (req, res) => {// logic to sign up admin
  let admin = req.body;
  let adminCheck = checkUser(ADMINS, admin.username);
  
  if(adminCheck === undefined){
    ADMINS.push(admin);
    
    const accessToken = generateJwt(admin);
    return res.status(201).json({ message: 'Admin created successfully', accessToken });
  }
  res.status(400).json({ message: "Admin's username provied is already registered" });
});


app.post('/admin/login', (req, res) => {// logic to log in admin
  let adminHeaders = req.headers;

  let admin = authenticateUser(ADMINS, adminHeaders.username, adminHeaders.password);

  if(admin !== undefined){
    const accessToken = generateJwt(admin);
    return res.json({ message: 'Logged in successfully', accessToken });
  }

  res.status(401).json({ message: 'Invalid Admin Credentials' });
});

app.post('/admin/courses', authenticateJwt, (req, res) => {// logic to create a course
  
    let newCourse = req.body;
    let courseCheck = findCourseWithTitle(newCourse);
  
    if(courseCheck === -1){
      //newCourse.id = COURSES.length+1;
      COURSES.push({ ...newCourse, id: COURSES.length+1 });

      return res.status(201).json({ message: 'Course created successfully', courseId: newCourse.id });
    }else{
      return res.status(400).json({ message: 'Course with this title is already added' })
    }
  
});

app.put('/admin/courses/:courseId', authenticateJwt, (req, res) => {// logic to edit a course
    let courseId = req.params.courseId;
  
    let courseIndex = findCourse(courseId);
   
    if(courseIndex !== -1){      
      let course = COURSES[courseIndex];
      Object.assign(course, req.body);

      return res.json({ message: 'Course updated successfully' })
    }else{
      return res.status(400).json({ message: 'Course with the course Id does not exist' });
    }
});

app.get('/admin/courses', authenticateJwt, (req, res) => {// logic to get all courses
    return res.json({ courses: COURSES});
});

// User routes
app.post('/users/signup', (req, res) => {// logic to sign up user
  let user = req.body;
  let userCheck = checkUser(USERS, user.username);
  
  if(userCheck === undefined){
    USERS.push(user);

    const token = generateJwt(user);
    return res.status(201).json({ message: 'User created successfully', token });
  }
  
  res.status(400).json({ message: "User's username provied is already registered" });
});

app.post('/users/login', (req, res) => {// logic to log in user
  let userHeaders = req.headers;

  let user = authenticateUser(USERS, userHeaders.username, userHeaders.password);
  if(user !== undefined){
    const token = generateJwt(user);
    return res.json({ message: 'Logged in successfully', token });
  }

  res.status(401).json({ message: 'Invalid User Credentials'});
});

app.get('/users/courses', authenticateJwt, (req, res) => {// logic to list all courses
    return res.json({ courses: COURSES.filter(course => course.published)});
});

app.post('/users/courses/:courseId', authenticateJwt, (req, res) => {// logic to purchase a course
  let courseId = parseInt(req.params.courseId);
  let courseIndex = COURSES.findIndex(course => (course.id === courseId && course.published));

  if(courseIndex !== -1) {
    let user = USERS.find(value => value.username === req.user.username);

    if(user){
      if(!user.purchasedCourses)
        user.purchasedCourses = [];
  
      let usersPurchasedCoursesCheck = user.purchasedCourses.findIndex(course => course.id === courseId);
      if (usersPurchasedCoursesCheck === -1) {
        user.purchasedCourses.push(COURSES[courseIndex]);
        return res.json({ message: 'Course purchased successfully' });
      } else {
        return res.status(400).json({ message: 'This Course is already purchased' });
      }
    }else{
      return res.status(403).json({ message: 'User not Found' });
    }
  }else{
    return res.status(404).send({ message: 'Course with the course Id does not exist to Purchase' });
  }
  
});

app.get('/users/purchasedCourses', authenticateJwt, (req, res) => {
  let user = USERS.find(value => value.username === req.user.username);
  if(user && user.purchasedCourses){
    return res.json({ purchasedCourses: user.purchasedCourses });
  }else{
    return res.status(404).json({ purchasedCourses: "No Purchased Courses" });
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});



function checkUser(list, username){
  return  list.find(value => value.username === username);
}

function authenticateUser(list, username, password){
  return  list.find(value => (value.username === username && value.password === password));
}

function findCourse(courseId){
  return COURSES.findIndex(course => course.id === parseInt(courseId));
}

function findCourseWithTitle(newCourse){
  return COURSES.findIndex(course => course.title === newCourse.title);
}