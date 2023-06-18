const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
const stripe = require("stripe")(process.env.PAYMENT_SECRET_TOKEN)


app.use(cors());
app.use(express.json());
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ASSCES_SECRET_TOKEN, (err, decoded) => {

        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access 2' })
        }
        req.decoded = decoded;

        next();
    })
}



app.get('/', (req, res) => {
    res.send(' Assiment 12 server is runing');
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lgfbklm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {


        const userdatacollaction = client.db("Summercamp").collection("userdata");
        const Classdatacollaction = client.db("Summercamp").collection("Classdata");
        const Enrolldatacollaction = client.db("Summercamp").collection("Enrolldata");
        const Feedbackdatacollaction = client.db("Summercamp").collection("Feedbackdata");
        const Paymentdatacollaction = client.db("Summercamp").collection("Paymentdata");
        const Instructordatacollaction = client.db("Summercamp").collection(" Instructordata");


        //----------------------jwt token-------------------------//
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ASSCES_SECRET_TOKEN, { expiresIn: '5h' })
            res.send({ token })
        })


        // --------------------veryfay admin--------------------//
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userdatacollaction.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }

        const verifyinstoter = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userdatacollaction.findOne(query);
            if (user?.role !== 'Instructor') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }


        //-----------------user data------------------------//
        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await userdatacollaction.find().toArray();
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body

            const query = { email: user.email }
            const existinguser = await userdatacollaction.findOne(query);
            if (existinguser) {
                return res.send({ message: 'user alrady exist' })
            }

            const result = await userdatacollaction.insertOne(user)

            res.send(result)
        })

        //---------------------admin---------------------------------//
        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email

            if (req.decoded.email !== email) {
                return res.send({ admin: false })
            }


            const query = { email: email }
            const user = await userdatacollaction.findOne(query)
            const result = { admin: user?.role === "admin" }
            res.send(result)
        })



        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const updatedoc = {
                $set: {
                    role: 'admin'
                }
            }

            const result = await userdatacollaction.updateOne(filter, updatedoc)
            res.send(result)
        })

        app.delete('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const result = await userdatacollaction.deleteOne(filter)
            res.send(result)
        })


        //----------------------------instoctor--------------------------//


        app.get('/users/Instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email

            if (req.decoded.email !== email) {
                return res.send({ Instructor: false })
            }


            const query = { email: email }
            const user = await userdatacollaction.findOne(query)
            const result = { Instructor: user?.role === "Instructor" }
            res.send(result)
        })

        app.patch('/users/Instructor/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const updatedoc = {
                $set: {
                    role: 'Instructor'
                }
            }

            const result = await userdatacollaction.updateOne(filter, updatedoc)
            res.send(result)
        })

        app.delete('/users/Instructor/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const result = await userdatacollaction.deleteOne(filter)
            res.send(result)
        })



        //-----------------classdata-----------------------//
        app.get('/classdata', async (req, res) => {
            const query = { status: 'Approve' }
            const option = {
                sort: { 'Enroll': -1 }
            }
            const result = await Classdatacollaction.find(query, option).toArray()
            res.send(result);
        })

        app.get('/classdatalimit', async (req, res) => {
            const query = { status: 'Approve' }
            const option = {
                sort: { 'Enroll': -1 },
                limit: 6
            }
            const result = await Classdatacollaction.find(query, option).toArray()
            res.send(result);
        })


        app.get('/classpdatedata/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await Classdatacollaction.findOne(query)
            res.send(result);
        })

        app.put('/classpdatedata/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true };
            const update = req.body
            const updatedoc = {
                $set: {
                    availableSeats: update.newseat,
                    Enroll: update.newEnroll,
                }
            }

            const result = await Classdatacollaction.updateOne(filter, updatedoc, option)
            res.send(result);
        })







        //---------------------------Enroll data------------------------//
        app.get("/Enroll", verifyJWT, async (req, res) => {
            const email = req.query.email
            if (!email) {
                res.send([])
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forviden access' })
            }

            const query = { email: email }
            const result = await Enrolldatacollaction.find(query).toArray()
            res.send(result)
        })

        app.post('/Enroll', async (req, res) => {
            const item = req.body
            const result = await Enrolldatacollaction.insertOne(item)
            res.send(result);
        })

        app.delete('/Enroll/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await Enrolldatacollaction.deleteOne(query);
            res.send(result)
        })



        app.get('/Enroll/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await Enrolldatacollaction.findOne(query)
            res.send(result)
        })


        //-----------------feedback-------------------//
        app.post('/feedback', async (req, res) => {
            const item = req.body
            const result = await Feedbackdatacollaction.insertOne(item)
            res.send(result);
        })

        app.get('/feedback', verifyJWT, async (req, res) => {
            const result = await Feedbackdatacollaction.find().toArray()
            res.send(result);
        })

        //----------------------------------Payment-------------------------//
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        app.post('/payments', verifyJWT, async (req, res) => {
            const payment = req.body;
            const insertResult = await Paymentdatacollaction.insertOne(payment);
            const id = payment.cartItems
            const query = { _id: { $in: [new ObjectId(id)] } };
            const deleteResult = await Enrolldatacollaction.deleteOne(query)
            res.send({ insertResult, deleteResult });
        })

        //-------------------------------Instructor data-----------------------------------//
        app.get('/Instructor', async (req, res) => {
            const result = await Instructordatacollaction.find().toArray()
            res.send(result)
        })



        app.get('/Instructorlimit', async (req, res) => {
            const query = {}
            const option = {
                limit: 6
            }
            const result = await Instructordatacollaction.find(query, option).toArray()
            res.send(result);
        })

        //--------------------------Instructor add data-------------------------------------//
        app.post('/Instructoradddata', async (req, res) => {
            const adddata = req.body;
            const result = await Classdatacollaction.insertOne(adddata);
            res.send(result);
        })

        //-----------------------watch the data collaction--------------------------------------------//
        //-------------High adbance-----------------------//
        app.get('/Instructoradddata', async (req, res) => {
            const query = { status: 'pending' }
            const option = {
                sort: { 'Enroll': -1 },
            }
            const result = await Classdatacollaction.find(query, option).toArray()
            res.send(result)
        })

        app.get('/Instructordata/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await Classdatacollaction.findOne(query)
            res.send(result)
        })

        app.put('/Instructordata/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true };
            const update = req.body
            const updatedoc = {
                $set: {
                    name: update.data.name,
                    img: update.data.img,
                    Ablablesit: update.data.Ablablesit,
                    price: update.data.price,
                }
            }
            const result = await Classdatacollaction.updateOne(filter, updatedoc, option)
            res.send(result)
        })


        app.put('/Instructorstatuse/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true };
            const updatedoc = {
                $set: {
                    status: 'Approve'
                }
            }
            const result = await Classdatacollaction.updateOne(filter, updatedoc, option)
            res.send(result)
        })

        //---------payment history-------------------------------------//

        app.get('/Paymenthistory', async (req, res) => {
            const { email } = req.query;
            const result = await Paymentdatacollaction.find({ email: email }).toArray();
            res.send(result)
        });







        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.listen(port, () => {
    console.log(`Assiment 12 server is run port ${port}`);
})