const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const admin = require("firebase-admin");
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// custom-middleware
const serviceAccount = require("./social-dev-events-auth-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFireBaseToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  // verify token
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
    console.log("after token validation", userInfo);
    next();
  } catch {
    console.log("invalid token");
    return res.status(401).send({ message: "Unauthorized Access" });
  }
};

// mongoDB Connetion
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dbz4f6f.mongodb.net/?appName=Cluster0`;
// const uri = `${process.env.DB_LOCAL}`;

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

    const db = client.db("social_events_db");
    const socialEventsCollection = db.collection("events");
    const eventJoinersCollection = db.collection("event_joiners");

    // apis

    app.post("/create-event", async (req, res) => {
      const newEvent = req.body;
      const result = await socialEventsCollection.insertOne(newEvent);
      res.send(result);
    });

    app.post("/join-event", async (req, res) => {
      const newJoinEvent = req.body;
      const result = await eventJoinersCollection.insertOne(newJoinEvent);
      res.send(result);
    });

    app.get("/upcoming-events", async (req, res) => {
      const result = await socialEventsCollection.find().toArray();
      res.send(result);
    });

    app.get("/latest-upcoming-events", async (req, res) => {
      const result = await socialEventsCollection
        .find()
        .sort({ event_date: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/upcoming-events/event-details/:id", async (req, res) => {
      const { id } = req.params;
      const result = await socialEventsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.get("/joined-events", verifyFireBaseToken, async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        if (email !== req.token_email) {
          return res.status(403).send({ message: "Forbidden Access" });
        }

        query.joiner_email = email;
      }
      const result = await eventJoinersCollection
        .find(query)
        .sort({ event_date: 1 })
        .toArray();
      res.send(result);
    });

    app.get("/manage-events", verifyFireBaseToken, async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        if (email !== req.token_email) {
          return res.status(403).send({ message: "Forbidden Access" });
        }

        query.creator_email = email;
      }
      const result = await socialEventsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/update-event/:id", async (req, res) => {
      const { id } = req.params;
      const result = await socialEventsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.patch("/update-event/:id", async (req, res) => {
      const { id } = req.params;
      const updatedEvent = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedEvent,
      };
      const options = {};
      const result = await socialEventsCollection.updateOne(
        query,
        update,
        options
      );
      res.send(result);
    });

    app.delete("/delete-event/:id", async (req, res) => {
      const { id } = req.params;
      const result = await socialEventsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("social DB is running on port:", port);
});
