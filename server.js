require('dotenv').config();
const express =require("express");
const app =express();
const ejs =require("ejs");
const expressLayout = require("express-ejs-layouts");
const path =require("path");
const mongoose =require("mongoose");
const session =require("express-session");
const flash =require('express-flash');
const mongoStore =require('connect-mongo');
const passport = require("passport");
const EventEmitter = require('events');



app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//Global middleware
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.user; 
  next();
});

//database connection

  mongoose.connect(process.env.MONGO_CONNECTION_URL);
  
  // Connection event handlers
  const connection = mongoose.connection;
  connection.once('open', () => {
    console.log("Database connected");
  }).on('error', err => {
    console.log("Connection failed:", err);
  });

  //event Emitter
  const eventEmitter = new EventEmitter();
  app.set("eventEmitter",eventEmitter);

// session config
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false, 
  store: mongoStore.create({ mongoUrl: process.env.MONGO_CONNECTION_URL }),
  cookie: { maxAge: 1000 *60 *60 *24}   // 24 hours
}))


//passport config
const passportInit=require("./app/config/passport");
const { Socket } = require('socket.io');
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())


app.use(expressLayout);
app.set("views",path.join(__dirname, "/resources/views"))
app.set ("view engine", "ejs");


require("./routes/web")(app);
app.use((req,res)=>{
  res.status(404).render("errors/404")
})




const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, ()=>{
    console.log(`listening on the port ${PORT}`)
})

// //socket.io

const io  =require("socket.io")(server);
io.on("connection", (socket)=>{
    // join 
  socket.on("join",(orderId)=>{
    socket.join(orderId);
  })
})
eventEmitter.on("orderUpdated",(data)=>{
  io.to(`order_${data.id}`).emit("orderUpdated",data)
})

eventEmitter.on("orderPlaced",(data)=>{
  io.to('adminRoom').emit("orderPlaced",data)
});