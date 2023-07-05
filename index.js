const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AKF SERVER IS RUNNING");
});

// akf_web
// QCXinTRM4Me2SpMW

const uri =
  "mongodb+srv://akf_web:QCXinTRM4Me2SpMW@cluster0.kuomool.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const userCollection = client.db("akf_web").collection("user");

    app.post("/users", async (req, res) => {
      const usersAll = req.body;
      const query={email:usersAll.email};
      const existingUser=await userCollection.findOne(query);
      if(existingUser){
        return res.send({message:'user already added'})
      };
      const result=await userCollection.insertOne(usersAll);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("akf server running port", port);
});
