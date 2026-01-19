const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://mdmoniruzzamanarafat_db_user:${process.env.DB_PASSWORD}@cluster0.cvx7qwv.mongodb.net/?appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );

    const database = client.db('career-code');
    const jobsCollection = database.collection('jobs');
    const appliedJobsCollection = database.collection('appliedJobs');

    // post jobs api
    app.post('/jobs', async (req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.status(201).json({
        status: 'success',
        data: result,
      });
    });

    // get all jobs api
    app.get('/jobs', async (req, res) => {
      const cursor = jobsCollection.find();
      const jobs = await cursor.toArray();
      res.status(200).json({
        status: 'success',
        length: jobs.length,
        data: jobs,
      });
    });

    // get single job api
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);
      res.status(200).json({
        status: 'success',
        data: job,
      });
    });

    // delete my posted job api
    app.delete('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    });

    // edit my posted job api
    app.patch('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const updatedJob = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await jobsCollection.updateOne(
        filter,
        { $set: updatedJob },
        options
      );
      res.status(200).json({
        status: 'success',
        data: result,
      });
    });

    app.post('/applyJob', async (req, res) => {
      const appliedJob = req.body;
      const result = await appliedJobsCollection.insertOne(appliedJob);
      res.status(201).json({
        status: 'success',
        data: result,
      });
    });
    app.get('/applyJob', async (req, res) => {
      const query = { email: req.query.email };
      const result = await appliedJobsCollection.find(query).toArray();
      res.status(200).json({
        status: 'success',
        data: result,
      });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
