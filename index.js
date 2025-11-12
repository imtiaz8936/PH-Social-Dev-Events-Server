const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

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
      console.log(newJoinEvent);
      const result = await eventJoinersCollection.insertOne(newJoinEvent);
      res.send(result);
    });

    app.get("/upcoming-events", async (req, res) => {
      const result = await socialEventsCollection.find().toArray();
      res.send(result);
    });

    app.get("/upcoming-events/event-details/:id", async (req, res) => {
      const { id } = req.params;
      const result = await socialEventsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.get("/joined-events", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.joiner_email = email;
      }
      const result = await eventJoinersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/manage-events", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.creator_email = email;
      }
      const result = await socialEventsCollection.find(query).toArray();
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
