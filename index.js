const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token || '';
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  // Verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    // Token is valid, proceed to the next middleware or route handler
    req.user = decoded; // You can store decoded information in req.user if needed
    console.log('Decoded JWT:', decoded);
    next();
  });
};

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

    // jwt token api
    app.post('/jwt', (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });

      // set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
      });
      res.status(200).json({ token });
    });

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
    app.get('/jobs/:id', verifyToken, async (req, res) => {
      console.log('cookies:', req.cookies);
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
