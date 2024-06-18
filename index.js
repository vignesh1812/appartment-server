const express = require("express");
const app = express();
const { connect } = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const upload = require("express-fileupload");
const { notFound, erorMiddleware } = require("./Middleware/errorMiddleware");
app.use(upload());
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.json({ limit: '70mb', extended: true }));
app.use(express.urlencoded({ limit: '70mb', extended: true }));
app.use(
  cors(
    {
      origin: "http://localhost:5173",
      credentials: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      optionsSuccessStatus: 204,
    }
  )
);
const userRoutes = require('./Routes/userRoutes')
const ticketRoutes = require('./Routes/ticketRoutes')
app.use('/api/user', userRoutes)
app.use('/api/tickets', ticketRoutes)
app.use(notFound)
app.use(erorMiddleware)

connect(process.env.MONGO_DB_URL).then(() => {
app.listen(process.env.PORT, () => {
  console.log(
    `DB CONNECTED SUCCESSFULLY AND SERVER RUNNING ON ${process.env.PORT}`,
    
  );

});
}).catch((error)=>{console.log(error)})