const passport = require("passport");
const User= require("../models/user");
const bcrypt =require("bcrypt");


const LocalStrategy = require("passport-local").Strategy

function init(passport){
    passport.use(new LocalStrategy({usernameField: "email"}, async (email,password,done)=>{
        //login 
        //check if email exists
        const user = await User.findOne({email : email})
        if(!user){
            return done (null,false, {message: "No user with this email"} )
        } 
        bcrypt.compare(password,user.password).then(match => {
            if(match){
                return done(null, user,{message: "logged in sucessfully"})
            }
            return done(null, false,{message: "Wrong Username or Password"})
        }).catch(err=>{
            return done(null, false,{message: "Something Went Wrong"})
        })
    }))
    passport.serializeUser((user,done)=>{
        done(null,user._id);
    });

    passport.deserializeUser(async (id,done)=>{
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    
    })
    

}

module.exports =init;