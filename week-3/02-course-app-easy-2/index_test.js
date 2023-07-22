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
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
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
    ADMINS.push({
      username: admin.username,
      password: admin.password
    });
    
    const token = generateJwt(admin);
    return res.status(201).json({ message: 'Admin created successfully', token });
  }
  res.status(400).json({ message: "Admin's username provied is already registered" });
});


app.post('/admin/login', (req, res) => {// logic to log in admin
  let adminHeaders = req.headers;

  let admin = authenticateUser(ADMINS, adminHeaders.username, adminHeaders.password);

  if(admin !== undefined){
    const token = generateJwt(admin);
    return res.json({ message: 'Logged in successfully', token });
  }

  res.status(401).json({ message: 'Invalid Admin Credentials' });
});

app.post('/admin/courses', authenticateJwt, (req, res) => {// logic to create a course
  
    let newCourse = req.body;
    let courseCheck = findCourseWithTitle(newCourse);
  
    if(courseCheck === -1){
      newCourse.id = COURSES.length+1;
      COURSES.push(newCourse);

      return res.status(201).json({ message: 'Course created successfully', courseId: newCourse.id });
    }else{
      return res.status(400).json({ message: 'Course with this title is already added' })
    }
  
});

app.put('/admin/courses/:courseId', authenticateJwt, (req, res) => {// logic to edit a course
  let courseId = req.params.courseId
  let updatedCourseDetails = req.body;

  let courseIndex = findCourse(courseId);
 
  if(courseIndex !== -1){      
    let course = COURSES[courseIndex];
    for(key in course){
      if(key !== 'id')//Request Body does not Have ID
        course[key] = updatedCourseDetails[key];
    }
    return res.json({ message: 'Course updated successfully' })
  }else{
    return res.status(400).json({ message: 'Course with the course Id does not exist' });
  }
});

app.get('/admin/courses', (req, res) => {// logic to get all courses
  return res.json({ courses: COURSES});
});

// User routes
app.post('/users/signup', (req, res) => {// logic to sign up user
  let user = req.body;
  let userCheck = checkUser(USERS, user.username);
  
  if(userCheck === undefined){
    USERS.push({
      username: user.username,
      password: user.password
      //purchasedCourses: []
    });
  
    return res.status(201).json({ message: 'User created successfully' });
  }
  
  res.status(400).json({ message: "User's username provied is already registered" });
});

app.post('/users/login', (req, res) => {// logic to log in user
  let userHeaders = req.headers;

  let user = authenticateUser(USERS, userHeaders.username, userHeaders.password);
  if(user !== undefined)
      return res.json({ message: 'Logged in successfully' });

  res.status(401).json({ message: 'Invalid User Credentials'});
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
});

app.listen(4000, () => {
  console.log('Server is listening on port 4000');
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