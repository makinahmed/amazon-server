const { MongoClient } = require('mongodb');
const express = require('express')
const app = express()
require('dotenv').config()
// const ObjectId = express().ObjectId;

const port = 5000;
const cors = require('cors')
app.use(cors())
app.use(express.json())
// app.ObjectId()
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-secreat-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m8c0v.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req?.headers?.authorization?.startsWith('Bearer ')) {
        console.log('hi');
        const idToken = req?.headers?.authorization?.split('Bearer ')[1]
        try {
            const decodeUser = await admin.auth().verifyIdToken(idToken)
            req.decodeUserEmail = decodeUser.email;

        }
        catch {

        }
    }
    next()
}
async function run() {
    try {
        await client.connect()
        const database = client.db('amazon_shop')
        const productCollection = database.collection("products");
        const ordersCollection = database.collection("orders");

        //GET products api

        app.get('/products', async (req, res) => {

            const cursor = productCollection.find({})
            const count = await cursor.count()
            const currentPage = req.query.currentPage;
            let products;
            if (currentPage) {
                products = await cursor.skip(currentPage * 10).limit(10).toArray()
            } else {
                products = await cursor.toArray();
            }

            res.send({ products, count });
        })


        // use POST  to get data by keys

        app.post('/products/byKeys', async (req, res) => {
            const keys = req.body;
            const query = { key: { $in: keys } }
            const products = await productCollection.find(query).toArray();
            // console.log(req.body);
            res.send(products)
        })


        //Add orders

        app.post('/orders', async (req, res) => {
            const order = req.body;
            // console.log('order',order);
            const result = await ordersCollection.insertOne(order)
            res.json(result)
        })


        app.get('/orders', verifyToken, async (req, res) => {
            const email = req?.query?.email;
            const decodeEmail = req?.decodeUserEmail;
            if (email === decodeEmail) {
                const cursor = ordersCollection.find({})
                const result = await cursor.toArray()
                res.json(result)
            } else {
                res.status(401).json({ message: 'User not Authorized!' })
            }
        })
    } finally {
        // await client.close();

    }
}
run().catch(console.dir());

app.get('/', async (req, res) => {
    console.log("This is Amazon!");
    res.send("HI")
})











app.listen(port, () => {
    console.log("Amazon is running in this port: ", port);
})
