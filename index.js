const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const MongoClient = require('mongodb').MongoClient;
const objectId = require('mongodb').ObjectID;
const { ObjectID } = require("bson");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sazzadcluster.wucws.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const productsCollection = client.db(`${process.env.DB_NAME}`).collection("products");
    const cartCollection = client.db(`${process.env.DB_NAME}`).collection("cart");
    const orderCollection = client.db(`${process.env.DB_NAME}`).collection("order");
    console.log("connected")
    app.get("/", (req, res) => {
        productsCollection.find({})
            .toArray((err, documments) => res.send(documments));
    });

    app.post("/addProduct", (req, res) => {
        const product = req.body;
        productsCollection.insertOne(product)
            .then(result => res.send(result.insertedCount > 0));
    })

    // app.get("/getProduct/:id", (req, res) => {
    //     // const id = req.query.id;
    //     // res.send("Hello")
    //     const id = req.params.id;
    //     productsCollection.find({ _id: objectId(id) }).toArray((err, result) => {
    //         res.send(result[0])
    //     });
    // });

    app.post("/addToCart", (req, res) => {
        const { id, user } = req.body;

        // console.log(user, id)
        productsCollection.find({ _id: objectId(id) })
            .toArray((err, result) => {

                //////
                cartCollection.insertOne({
                    pId: result[0]._id,
                    name: result[0].name,
                    weight: result[0].weight,
                    quantity: 1,
                    price: result[0].price,
                    user: user
                })
                    .then(result => res.send(result.insertedCount > 0));
                /////
            });
    });


    app.get("/myCart/:user", (req, res) => {
        const user = req.params.user;
        cartCollection.find({ user: user })
            .toArray((err, documments) => res.send(documments));
    });


    app.post("/placeOrder", (req, res) => {
        const { user } = req.body;
        cartCollection.find({ user: user })
            .toArray((err, documments) => {
                if (err === null) {
                    orderCollection.insertMany(documments).then(result => {
                        if (result.insertedCount > 0) {
                            cartCollection.deleteMany({ user: user }).then(result => res.send(result.deletedCount > 0))
                        }
                    })
                }
            });

    })


    app.get("/myOrders/:user", (req, res) => {

        const user = req.params.user;
        // console.log(user)
        orderCollection.find({ user: user })
            .toArray((err, documments) => res.send(documments));
    });

    app.delete("/deleteProduct", (req, res) => {
        const { id } = req.body;
        productsCollection.deleteOne({ _id: objectId(id) }).then(result => res.send(result.deletedCount > 0))
    });
});



app.listen(process.env.PORT || PORT, () => console.log("Port is listening"));