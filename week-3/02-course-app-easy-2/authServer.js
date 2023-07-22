require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];


function generateAccessToken(user){
  const payload = { username: user.username };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20s' });
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
    
    const accessToken = generateAccessToken(admin);
    //const refreshToken = jwt.sign({ username: admin.username }, process.env.REFRESH_TOKEN_SECRET);

    return res.status(201).json({ message: 'Admin created successfully', accessToken });
  }
  res.status(400).json({ message: "Admin's username provied is already registered" });
});


app.post('/admin/login', (req, res) => {// logic to log in admin
  let adminHeaders = req.headers;

  let admin = authenticateUser(ADMINS, adminHeaders.username, adminHeaders.password);

  if(admin !== undefined){
    const accessToken = generateJwt(admin);
    const refreshToken = jwt.sign({ username: admin.username }, process.env.REFRESH_TOKEN_SECRET); 
    return res.json({ message: 'Logged in successfully', accessToken, refreshToken });
  }

  res.status(401).json({ message: 'Invalid Admin Credentials' });
});


// User routes
app.post('/users/signup', (req, res) => {// logic to sign up user
  let user = req.body;
  let userCheck = checkUser(USERS, user.username);
  
  if(userCheck === undefined){
    USERS.push({
      username: user.username,
      password: user.password,
      //purchasedCourses: []
    });

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

app.listen(5000, () => {
  console.log('Server is listening on port 5000');
});



function checkUser(list, username){
  return  list.find(value => value.username === username);
}

function authenticateUser(list, username, password){
  return  list.find(value => (value.username === username && value.password === password));
}