const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
  "http://localhost:5173",
  "https://destination-dream-ebfea.web.app",
  "https://zippy-faloodeh-6b6412.netlify.app",
  "https://destination-dream-client-sidte-a10.vercel.app",
],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l4sutcp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let dbPromise;

async function getCollections() {
  if (!dbPromise) {
    dbPromise = client.connect()
      .then(async () => {
        await client.db("admin").command({ ping: 1 });
        console.log("MongoDB connected successfully!");

        const db = client.db("destinationDB");

        return {
          destinationCollection: db.collection("destination"),
          categoryCollection: db.collection("destination_category"),
        };
      })
      .catch((error) => {
        dbPromise = null;
        throw error;
      });
  }

  return dbPromise;
}

// Async error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Home route
app.get("/", (req, res) => {
  res.send("Destination Dreams server site is running");
});

// Get destinations by email
app.get(
  "/destination_email/:email",
  asyncHandler(async (req, res) => {
    const { destinationCollection } = await getCollections();

    const result = await destinationCollection
      .find({ email: req.params.email })
      .toArray();

    res.send(result);
  })
);

// Get all destinations
app.get(
  "/destination",
  asyncHandler(async (req, res) => {
    const { destinationCollection } = await getCollections();

    const result = await destinationCollection.find().toArray();

    res.send(result);
  })
);

// Add destination
app.post(
  "/destination",
  asyncHandler(async (req, res) => {
    const { destinationCollection } = await getCollections();

    const newDestination = req.body;

    const result = await destinationCollection.insertOne(newDestination);

    res.send(result);
  })
);

// Get all categories
app.get(
  "/destination_category",
  asyncHandler(async (req, res) => {
    const { categoryCollection } = await getCollections();

    const result = await categoryCollection.find().toArray();

    res.send(result);
  })
);

// Get destinations by country
app.get(
  "/categoryCollection/:Country",
  asyncHandler(async (req, res) => {
    const { destinationCollection } = await getCollections();

    const result = await destinationCollection
      .find({ Country: req.params.Country })
      .toArray();

    res.send(result);
  })
);

// Update destination
app.put(
  "/destination/:id",
  asyncHandler(async (req, res) => {
    const { destinationCollection } = await getCollections();

    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid destination ID" });
    }

    const updatedDestination = req.body;

    const filter = { _id: new ObjectId(id) };

    const destination = {
      $set: {
        name: updatedDestination.name,
        Country: updatedDestination.Country,
        spotLocation: updatedDestination.spotLocation,
        averageCost: updatedDestination.averageCost,
        seasonality: updatedDestination.seasonality,
        tavelTime: updatedDestination.tavelTime,
        photo: updatedDestination.photo,
        totalVisitors: updatedDestination.totalVisitors,
        email: updatedDestination.email,
        displayName: updatedDestination.displayName,
        description: updatedDestination.description,
      },
    };

    const result = await destinationCollection.updateOne(
      filter,
      destination,
      { upsert: true }
    );

    res.send(result);
  })
);

// Get destination by ID
app.get(
  "/destination/:id",
  asyncHandler(async (req, res) => {
    const { destinationCollection } = await getCollections();

    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid destination ID" });
    }

    const result = await destinationCollection.findOne({
      _id: new ObjectId(id),
    });

    res.send(result);
  })
);

// Delete destination
app.delete(
  "/destination/:id",
  asyncHandler(async (req, res) => {
    const { destinationCollection } = await getCollections();

    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid destination ID" });
    }

    const result = await destinationCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.send(result);
  })
);

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).send({
    message: "Internal Server Error",
  });
});

// Local development
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Destination Dreams server running on port: ${port}`);
  });
}

// Vercel serverless export
module.exports = app;
