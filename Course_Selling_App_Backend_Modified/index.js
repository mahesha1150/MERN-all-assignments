const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");

const app = express();

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