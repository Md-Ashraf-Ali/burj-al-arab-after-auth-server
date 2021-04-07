const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config()
console.log(process.env.DB_PASS);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.omdln.mongodb.net/burjAlArab?retryWrites=true&w=majority`;



const port = 5000


const app = express()
app.use(cors());
app.use(express.json());





var serviceAccount = require("./configs/burj-al-arab-82b0b-firebase-adminsdk-egrr2-721a855b3b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookingsCollection = client.db("burjAlArab").collection("bookings");
  
    app.post('/addBooking',(req,res) => {
        const newBooking = req.body;
        bookingsCollection.insertOne(newBooking)
        .then(result => {
            res.send(result.insertedCount > 0);
        })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')){
            const IdToken = bearer.split(' ')[1];
            
            // idToken comes from the client app
            admin
            .auth()
            .verifyIdToken(idToken)
            .then((decodedToken) => {
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            if (tokenEmail == queryEmail){
                bookingsCollection.find({email:queryEmail}) 
                .toArray((err, items) => {
                    res.status(200).send(items);

                })

            }
            {
                res.status(401).send('un-authorized access')
            }
        
            })
            .catch((error) => {
                res.status(401).send('un-authorized access')
            });
        }
        else{
            res.status(401).send('un-authorized access')
        } 
    })
});

app.listen(port)