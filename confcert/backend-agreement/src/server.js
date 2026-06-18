import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

const PORT = 5503;

app.get('/', (req,res)=>{
    res.send("Running port");
})

app.listen(PORT, ()=>{
    console.log("App is running in port: ", PORT);
})