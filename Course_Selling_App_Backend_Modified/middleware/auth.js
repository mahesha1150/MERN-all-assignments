require('dotenv').config();
const jwt = require('jsonwebtoken');

//const SECRET = 'SECr3t';  // This should be in an environment variable in a real application


/* function generateJwt(user){
  const payload = { username: user.username };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
} */

const authenticateAdminJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;

    const token = authHeader && authHeader.split(' ')[1]; //First checks authHeader. If it is not present we get undefined
    if (token === undefined || token === '') return res.status(401).json({ message: 'No Token is present' })

    jwt.verify(token, process.env.ADMIN_ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' })

        req.user = user;
        next();
    });
}

const authenticateUserJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; //First checks authHeader. If it is not present we get undefined
    if (token === undefined || token === '') return res.status(401).json({ message: 'No Token is present' })

    jwt.verify(token, process.env.USER_ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' })

        req.user = user;
        next();
    });
}


module.exports = {
    authenticateAdminJwt,
    authenticateUserJwt/* ,
    SECRET */
}