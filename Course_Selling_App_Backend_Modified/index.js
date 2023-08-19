const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");
const bodyParser = require('body-parser');

const app = express();

// Increase payload limit (e.g., 10MB)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


/* app.use(cors({
  credentials: true,
  origin: "http://localhost:5173"
})); */
app.use(cors());
app.use(express.json());

app.use("/admin", adminRouter);
app.use("/users", userRouter);


//Connect to MongoDB
mongoose.connect('mongodb+srv://mahesh_a:adAG6ZWfkCm9r3aH@cluster0.wb7pze3.mongodb.net/courses', { useNewUrlParser: true, useUnifiedTopology: true/*, dbName: "courses"*/ });









app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});