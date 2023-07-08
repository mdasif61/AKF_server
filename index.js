const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AKF SERVER IS RUNNING");
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorized" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.make_token, (err, decoded) => {
    if (err) {
      return res.status(401).send("unauthorized");
    }
    req.decoded = decoded;
    next();
  });
};

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
    const blogCollection = client.db("akf_web").collection("blog");

    // jwt api
    app.post("/jwt", (req, res) => {
      try {
        const loggedUser = req.body;
        const token = jwt.sign(loggedUser, process.env.make_token, {
          expiresIn: "1h",
        });
        res.send({ token });
      } catch (error) {
        console.log(error);
      }
    });

    // user post api
    app.post("/users", async (req, res) => {
      const usersAll = req.body;
      const query = { email: usersAll.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already added" });
      }
      const result = await userCollection.insertOne(usersAll);
      res.send(result);
    });

    // user get api
    app.get("/users", verifyJWT, async (req, res) => {
      try {
        const userEmail = req.query.email;
        const query = { email: userEmail };
        const result = await userCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // update user data api
    app.patch("/profile-update", async (req, res) => {
      try {
        const userEmail = req.query?.email;
        const userData = req.body;
        userData.name = req.body.firstName.concat(" " + req.body.lastName);
        const filter = { email: userEmail };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            ...userData,
          },
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // all blog post api
    app.post('/all-post', verifyJWT, async (req, res) => {
      try {
        const blog = req.body;
        const result = await blogCollection.insertOne(blog);
        res.send(result)
      } catch (error) {
        console.log(error)
      }
    })

    // get my blog api
    app.get('/my-blog', verifyJWT, async (req, res) => {
      try {
        const email = req.query?.email;
        const query = { email: email };
        const result = await blogCollection.find(query).toArray();
        res.send(result)
      } catch (error) {
        console.log(error)
      }
    })

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
