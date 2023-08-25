const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
            userName: userData.name
          },
        };
        if (userData.name) {
          updateDoc.$set.name = userData.name
        }
        if (userData.lastName) {
          updateDoc.$set.lastName = userData.lastName
        }
        if (userData.blood) {
          updateDoc.$set.blood = userData.blood
        }
        if (userData.bio) {
          updateDoc.$set.bio = userData.bio
        }
        if (userData.gender) {
          updateDoc.$set.gender = userData.gender
        }
        if (userData.phone) {
          updateDoc.$set.phone = userData.phone
        }
        if (userData.address) {
          updateDoc.$set.address = userData.address
        };

        // blog userName update
        await blogCollection.updateMany(filter, updateDoc);

        const result = await userCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);

      } catch (error) {
        console.log(error);
      }
    });

    // all blog post api
    app.post("/all-post", verifyJWT, async (req, res) => {
      try {
        const blog = req.body;
        const result = await blogCollection.insertOne(blog);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get my blog api
    app.get("/my-blog", verifyJWT, async (req, res) => {
      try {
        const email = req.query?.email;
        const query = { email: email };
        const result = await blogCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get all blog api
    app.get("/all-blog", verifyJWT, async (req, res) => {
      try {
        const result = await blogCollection
          .find({})
          .sort({ date: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get search blog-api
    app.get('/search-blog/:searchText', verifyJWT, async (req, res) => {
      try {
        const searchText = req.params.searchText;
        const result = await blogCollection.find({
          $or: [
            { text: { $regex: searchText, $options: "i" } },
            { userName: { $regex: searchText, $options: "i" } }
          ]
        }).toArray();
        res.send(result)
      } catch (error) {
        console.log(error)
      }
    })

    // get self-blog api
    app.get('/self-blog/:id', verifyJWT, async (req, res) => {
      try {
        const id = req?.params?.id;
        const searchText = req?.query?.selfBlog;
        const query = {
          userId: id,
          $or: [
            { text: { $regex: searchText, $options: "i" } },
            { userName: { $regex: searchText, $options: "i" } }
          ]
        }
        const result = await blogCollection.find(query).toArray();
        res.send(result)
      } catch (error) {
        console.log(error)
      }
    })

    // get user profile hover api
    app.get("/user-profile/:id", verifyJWT, async (req, res) => {
      try {
        const id = req.params?.id;
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // delete blog api
    app.delete("/remove-blog/:id", verifyJWT, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await blogCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // see-profile api
    app.get("/blog/see-profile/:id", verifyJWT, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { userId: id };
        const result = await blogCollection.find(query).toArray();
        const image = await blogCollection.findOne(query);
        res.send({ result, image });
      } catch (error) {
        console.log(error);
      }
    });

    // update reaction api
    app.patch("/blog/reaction/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const reactName = req.query?.react;
      const user = req.query?.user;
      const data = req?.body;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {};
      const previousReaction = Object.keys(data.reaction).find(
        (reaction) =>
          data.reaction[reaction]?.users?.includes(user) && reaction !== reactName
      );

      if (previousReaction) {
        updateDoc.$set = {
          ...updateDoc.$set,
          [`reaction.${previousReaction}.count`]: data.reaction[previousReaction]?.count - 1
        };
        updateDoc.$pull = {
          ...updateDoc.$pull,
          [`reaction.${previousReaction}.users`]: user
        };
      }

      if (!data.reaction[reactName]?.users?.includes(user)) {
        updateDoc.$set = {
          ...updateDoc.$set,
          [`reaction.${reactName}.count`]: data.reaction[reactName]?.count + 1
        };
        updateDoc.$push = {
          ...updateDoc.$push,
          [`reaction.${reactName}.users`]: user
        };
      } else if (data.reaction[reactName]?.users?.includes(user) && data.reaction[reactName].count > 0) {
        updateDoc.$set = {
          ...updateDoc.$set,
          [`reaction.${reactName}.count`]: data.reaction[reactName]?.count - 1
        };
        updateDoc.$pull = {
          ...updateDoc.$pull,
          [`reaction.${reactName}.users`]: user
        };
      }

      const result = await blogCollection.updateOne(filter, updateDoc);
      res.send({ result, reactName });
    });




    // single reaction get
    app.get('/single-reaction/:id', verifyJWT, async (req, res) => {
      const userId = req.params.id;
      const id = req.query?.ids;
      const query = { _id: new ObjectId(id) }
      const blogs = await blogCollection.find(query).toArray();
      const reactions = req.query?.reaction.split(',') || [];

      const currentUserReact = blogs.map((blog) => {
        const reaction = {};
        for (const reactName of reactions) {
          if (
            blog.reaction[reactName] &&
            blog.reaction[reactName]?.users?.includes(userId) &&
            blog.reaction[reactName].count > 0
          ) {
            reaction[reactName] = blog.reaction[reactName].count;
          }
        }
        return { blogId: blog._id, reaction };
      });

      res.send(currentUserReact);
    });

    app.get('/total-reaction-count/:id', verifyJWT, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const blogs = await blogCollection.find(query).toArray();

        const blogsWithTotalReactionCounts = blogs.map((blog) => {
          const totalReactionCount = Object.values(blog.reaction).reduce((sum, reaction) => sum + reaction.count, 0);

          const remainIcon = Object.keys(blog.reaction).filter((icon) => blog.reaction[icon].count > 0);

          return { totalReactionCount, remainIcon };
        });
        const totalSum = blogsWithTotalReactionCounts.reduce((sum, count) => sum + count, 0);
        res.send(blogsWithTotalReactionCounts);
      } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred");
      }
    });

    // reacted-profile-api
    app.get('/reacted-profile/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const checkUser = await blogCollection.find(query).toArray();
      const getUserId = checkUser.flatMap((user) => {
        const reactions = user.reaction;
        const userByReaction = Object.values(reactions).flatMap((reaction) => reaction.users)
        return userByReaction.flat()
      });
      const users = await userCollection.find({ _id: { $in: getUserId.map((id) => new ObjectId(id)) } }).toArray();
      res.send(users)
    });

    // comments post-api
    app.patch('/blog/comments/:id', verifyJWT, async (req, res) => {
      const blogId = req?.params?.id;
      const comment = req?.body;
      const userId = req?.query?.user;
      const filter = { _id: new ObjectId(blogId) };

      const updateDoc = {
        $push: {
          comments: { comment: comment.comment, user: userId }
        }
      }
      const result = await blogCollection.updateOne(filter, updateDoc);
      res.send(result)
    });

    // get comment profile
    app.get('/comment-profile/:id', verifyJWT, async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) }
      const blogs = await blogCollection.find(query).toArray();
      const findCommentId = blogs.flatMap((blog) => {
        const comment = blog.comments;
        const commentId = comment?.flatMap((userId) => userId.user);
        return commentId.flat()
      });

      const result = await userCollection.find({ _id: { $in: findCommentId.map((id) => new ObjectId(id)) } }).toArray();
      res.send(result)
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
