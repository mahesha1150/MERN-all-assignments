const express = require('express');
//const bodyParser = require('body-parser');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

// Admin routes
app.post('/admin/signup', (req, res) => {// logic to sign up admin
  let admin = req.body;
  let adminCheck = checkUser(ADMINS, admin.username);
  
  if(adminCheck === undefined){
    /* ADMINS.push({
      username: admin.username,
      password: admin.password
    }); */
    ADMINS.push(admin);
  
    return res.status(201).json({ message: 'Admin created successfully' });
  }
  res.status(400).json({ message: "Admin's username provied is already registered" });
});

app.post('/admin/login', (req, res) => {// logic to log in admin
  let adminHeaders = req.headers;

  let admin = authenticateUser(ADMINS, adminHeaders.username, adminHeaders.password);

  if(admin !== undefined)
      return res.json({ message: 'Logged in successfully' });

  res.status(401).json({ message: 'Invalid Admin Credentials' });
});

app.post('/admin/courses', (req, res) => {// logic to create a course
  let adminHeaders = req.headers;
  let admin = authenticateUser(ADMINS, adminHeaders.username, adminHeaders.password);
  
  if(admin !== undefined){
    let newCourse = req.body;
    let courseCheck = findCourseWithTitle(newCourse);
  
    if(courseCheck === -1){
      /* COURSES.push({
        title: newCourse.title,
        description: newCourse.description,
        price: newCourse.price,
        imageLink: newCourse.imageLink,
        published: newCourse.published,
        id: courseId
      }); */
      newCourse.id = COURSES.length+1;
      COURSES.push(newCourse);
    
      return res.status(201).json({ message: 'Course created successfully', courseId: newCourse.id });
    }else{
      return res.status(400).json({ message: 'Course with this title is already added' })
    }
  
  }
  res.status(401).json({ message: 'Unauthorized to add a new course' });
});

app.put('/admin/courses/:courseId', (req, res) => {// logic to edit a course
  let adminHeaders = req.headers;
  let admin = authenticateUser(ADMINS, adminHeaders.username, adminHeaders.password);
  
  if(admin !== undefined){
    let courseId = parseInt(req.params.courseId);
    let updatedCourseDetails = req.body;
  
    let courseIndex = findCourse(courseId);
   
    if(courseIndex !== -1){
      //1st and Basic Approach
      /* COURSES[courseIndex].title = updatedCourseDetails.title;
      COURSES[courseIndex].description = updatedCourseDetails.description;
      COURSES[courseIndex].price = updatedCourseDetails.price;
      COURSES[courseIndex].imageLink = updatedCourseDetails.imageLink;
      COURSES[courseIndex].published = updatedCourseDetails.published; */
      
      let course = COURSES[courseIndex];
      //2nd and Better Approach
      /* for(key in course){
        if(key !== 'id')//Request Body does not Have ID
          course[key] = updatedCourseDetails[key];
      } */

      //3rd and Best Approach
      Object.assign(course, req.body);
      return res.json({ message: 'Course updated successfully' })
    }else{
      return res.status(400).json({ message: 'Course with the course Id does not exist' });
    }
  }
  res.status(401).json({ message: 'Unauthorized to update the course' });
});

app.get('/admin/courses', (req, res) => {// logic to get all courses
  let adminHeaders = req.headers;
  let admin = authenticateUser(ADMINS, adminHeaders.username, adminHeaders.password);
  
  if(admin !== undefined){
    return res.json({ courses: COURSES});
  }
  res.status(401).json({ message: 'Unauthorized to get the courses' });
});

// User routes
app.post('/users/signup', (req, res) => {// logic to sign up user
  let user = req.body;
  //let user = Object.assign({}, req.body, {purchasedCourses: []});//{} Will create a new object and copy the values to it.
  //let user = { ...req.body, purchasedCourses: []};
  let userCheck = checkUser(USERS, user.username);
  
  if(userCheck === undefined){
    /* USERS.push({
      username: user.username,
      password: user.password
      //purchasedCourses: []
    }); */
    
    USERS.push(user);
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

app.get('/users/courses', (req, res) => {// logic to list all courses
  let userHeaders = req.headers;

  let user = authenticateUser(USERS, userHeaders.username, userHeaders.password);
  if(user !== undefined)
    return res.json({ courses: COURSES.filter(course => course.published)});

  res.status(401).json({ message: 'Unauthorized to get the courses' });
});

app.post('/users/courses/:courseId', (req, res) => {// logic to purchase a course
  let userHeaders = req.headers;

  let user = authenticateUser(USERS, userHeaders.username, userHeaders.password);
  
  if(user !== undefined){

    let courseId = parseInt(req.params.courseId);
    let courseIndex = COURSES.findIndex(course => (course.id === courseId && course.published));
  
    if(courseIndex !== -1) {
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
      return res.status(404).send({ message: 'Course with the course Id does not exist to Purchase' });
    }
  
  }

  res.status(401).json({ message: 'Unauthorized to purchase the course' }); 
  
});

app.get('/users/purchasedCourses', (req, res) => {
  let userHeaders = req.headers;
  let user = authenticateUser(USERS, userHeaders.username, userHeaders.password);

  if(user !== undefined){
    if(user.purchasedCourses){
      return res.json({ purchasedCourses: user.purchasedCourses });
    }else{
      return res.status(404).json({ purchasedCourses: "No Purchased Courses" });
    }
  }
  res.status(401).json({ message: 'Unauthorized to get the list of Purchased courses' });
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
  return COURSES.findIndex(course => course.id === courseId);
}

function findCourseWithTitle(newCourse){
  return COURSES.findIndex(course => course.title === newCourse.title);
}	