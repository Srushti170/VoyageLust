if(process.env.NODE_ENV!=="production"){
    require('dotenv').config();
}


const express=require("express");
const app=express();
const mongoose = require("mongoose");
const path =require ("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const expressError=require("./utils/expressError.js");
const listingRouter= require("./routes/listing.js")
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")
const session = require("express-session");
const MongoStore = require('connect-mongo').default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const dbURL = process.env.ATLAS_URL

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() { 
  await mongoose.connect(dbURL);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"))
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
// use ejs-locals for all ejs templates:

app.engine("ejs",ejsMate);
app.use( express.static(path.join(__dirname,"/public")))



const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET
  },
  touchAfter: 24 * 3600 // time period in seconds
});

store.on("error", (err) => {
    console.log("session store error", err);
});


const sessionOptions={
  store,
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{

    expire:Date.now()+1000*60*60*24*7,
    maxAge:1000*60*60*24*7,
    httpOnly:true
  }
}

// app.get("/",(req,res)=>{
//     res.send("i am root");
// })

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currUser=req.user;
  next();
});

app.use((req, res, next) => {
  res.locals.maptilerKey = process.env.MAPTILER_API_KEY;
  next();
});


app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter)
app.use("/",userRouter);

app.use((req, res, next) => {
  next(new expressError(404, "Page not found"));
});

app.use((err,req,res,next)=>{
  let{statusCode=500,message="something went wrong"}=err;
res.status(statusCode).render("error.ejs",{err})
  //res.status(statusCode).send(message)
})




app.listen(8080,()=>{
    console.log("port 8080 running")
})