import mysql from "mysql";
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";
import 'dotenv/config';

// const masterKey = "12345678";
const masterKey = process.env.MASTER_KEY;
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended:true}));

var conn = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"root",
    database: "world"
});

conn.connect(function(err){
    if(err)
        throw err;
    console.log("Connection successful");
});

app.post("/api/signup",(req,res)=>{
    const id=req.body.id;
    const un=req.body.username;
    const pass=req.body.password;
    const email=req.body.email;
    var sql="INSERT into Users (ID,username,password,email) VALUES (?,?,?,?)";
    conn.query(sql, [id,un,pass,email], function(err,result){
        if(err) throw err;
        res.send({
            status: "Account successfully created",
            status_code : "200",
            user_id :  id
        });
    });
});

app.post("/api/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    var sql = "Select * from Users where username=? AND password=?";
    conn.query(sql, [username,password], function(err,result){
        if(err){
            res.send({
                status: "Incorrect username/password provided. Please retry.",
                status_code : "401"
            });
        }
        const token=jwt.sign({username},'secret_key');
        res.json({
            status: "Login successfull",
            status_code : "200",
            user_id :  result[0].username,
            access_token : token
        });
    });
});

app.post("/api/trains/create", (req,res)=>{
    const key=req.query.key;
    if(key != masterKey)
    {
        res.json({
            error:"Unauthorized action"
        });
    }
    const id=req.body.id;
    const train_name=req.body.train_name;
    const source=req.body.source;
    const destination=req.body.destination;
    const seat_capacity=req.body.seat_capacity;
    const arr_time_at_source=req.body.arr_time_at_source;
    const arr_time_at_dest=req.body.arr_time_at_dest;
    var sql="INSERT into Train (id,name,source,destination,seat,arrival_src,arrival_dest) VALUES (?,?,?,?,?,?,?)";
    conn.query(sql,[id,train_name,source,destination,seat_capacity,arr_time_at_source,arr_time_at_dest], function(err,result){
        if(err) throw err;
        res.send({
            message: "Train added successfully",
            train_id :  id
        });
    });
});


app.get("/api/train/availability", (req,res)=>{
    const source=req.query.source;
    const dest=req.query.destination;
    var sql = "Select id,name,seat from Train where source=? AND destination=?";
    conn.query(sql,[source,dest], function(err,result){
        if(err){
            res.send({
                status: "No trains found",
                status_code : "401"
            });
        }
        res.json(result);
    });
});

// const config ={
//     headers: { Authorization: 'Bearer'}
// }
app.post("/api/trains/:train_id/book",(req,res) => {
    const id=parseInt(req.params.train_id);
    const no_of_seats=req.body.seats;
    const user_id=req.body.id;
    const bookedSeats =[];
    var sql = "Select * from Train where id=?";
    conn.query(sql,[id],function(err,result) {
        if(err){
            res.send({
                status: "Cannot fetch",
                status_code : "500"
            });
        }
        const seatAvail=result[0].seat;
        if(seatAvail>=no_of_seats)
        {
            const update = 'UPDATE train SET seat = ? WHERE id = ?';
            const newSeatAvailable = seat - no_of_seats;
            for(let i=1;i<=no_of_seats;i++)
            {
                bookedSeats.push(i);
            }
            conn.query(update,[newSeatAvailable,id],function(err){
                if(err){
                    res.json({
                        status: "Availability cannot be fetched",
                        status_code : "500"
                    });
                }
                res.json({
                    message: "Seat booked successfully",
                    booking_id: uuidv4(),
                    seat_numbers: bookedSeats
                });
            });
            const insert = "INSERT into Booking (id,train_id,train_name,user_id,no_of_seat,arrival_src,arrival_dest) VALUES (?,?,?,?,?,?,?)";
            conn.query(insert,[booking_id,id,result[0].name,user_id,no_of_seats,result[0].arr_source,result[0].arr_dest], function(err,result){
                if(err) throw err;
                res.json({
                    message: "Table updated successfully"  
                });
            });
        }
        else{
            res.json({
                status: "No seat available"
            });
        }
    });
});

app.get("/api/bookings/:booking_id", (req,res)=>{
    const bookingId=req.params.booking_id;
    var sql="SELECT * from Booking where id=?";
    conn.query(sql, [bookingId],function(err,result){
        if(err)
        {
            res.send({
                status: "Cannot fetch",
                status_code : "500"
            });
        }
        if(result.length === 0)
        {
            res.json({
                message: "booking not found"
        });
        }
        else{
            const booking =result[0];
            res.json({booking});
        }
    });
});


app.listen(port, () =>{
    console.log("Listening on port 3000");
});