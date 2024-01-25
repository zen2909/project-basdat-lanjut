const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const uri = 'mongodb://localhost:27017/basdat';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
}

async function displayData(res, searchFilter) {
  try {
    const database = client.db('basdat');
    const collection = database.collection('hp');

    let query = {};

    if (searchFilter) {
      query = {
        $or: [
          { model: { $regex: `.*${searchFilter}.*`, $options: 'i' } },
          { processor: { $regex: `.*${searchFilter}.*`, $options: 'i' } },
        ],
      };
    }

    const cursor = collection.find(query);
    const data = await cursor.toArray();

    res.render('index', { data, searchFilter });
  } catch (error) {
    console.error('Error displaying data', error);
    res.status(500).send('Internal Server Error');
  }
}

app.get('/search', async (req, res) => {
  const searchFilter = req.query.q;

  await connectDB();
  await displayData(res, searchFilter);
});

app.get('/update/:id', async (req, res) => {
  try {
    const database = client.db('basdat');
    const collection = database.collection('hp');

    const id = req.params.id;
    const result = await collection.findOne({ _id: new ObjectId(id) });

    res.render('update', { data: result });
  } catch (error) {
    console.error('Error rendering update page', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/update/:id', async (req, res) => {
  try {
    const database = client.db('basdat');
    const collection = database.collection('hp');

    const id = req.params.id;
    const newData = {
      model: req.body.model,
      price: req.body.price,
      rating: req.body.rating,
      sim: req.body.sim,
      processor: req.body.processor,
      ram: req.body.ram,
      battery: req.body.battery,
      display: req.body.display,
      camera: req.body.camera,
      card: req.body.card,
      os: req.body.os,
    };

    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: newData });
    console.log(`Updated data with ID: ${id}`, result);

    res.redirect('/');
  } catch (error) {
    console.error('Error updating data', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/delete/:id', async (req, res) => {
  try {
    const database = client.db('basdat');
    const collection = database.collection('hp');

    const id = req.params.id;

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    console.log(`Deleted data with ID: ${id}`, result);

    res.redirect('/');
  } catch (error) {
    console.error('Error deleting data', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add', (req, res) => {
  res.render('add');
});

app.post('/add', async (req, res) => {
  try {
    const database = client.db('basdat');
    const collection = database.collection('hp');

    const newData = {
      model: req.body.model,
      price: req.body.price,
      rating: req.body.rating,
      sim: req.body.sim,
      processor: req.body.processor,
      ram: req.body.ram,
      battery: req.body.battery,
      display: req.body.display,
      camera: req.body.camera,
      card: req.body.card,
      os: req.body.os,
    };

    const result = await collection.insertOne(newData);
    console.log(`Inserted new data with ID: ${result.insertedId}`);

    res.redirect('/');
  } catch (error) {
    console.error('Error adding data', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/suggest', async (req, res) => {
  try {
    const database = client.db('basdat');
    const collection = database.collection('hp');

    const keyword = req.query.q;
    const query = { model: { $regex: `.*${keyword}.*`, $options: 'i' } };
    const cursor = collection.find(query).limit(5);
    const suggestions = await cursor.toArray();

    res.json(suggestions);
  } catch (error) {
    console.error('Error suggesting data', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/compare', async (req, res) => {
  try {
    await connectDB();
    const database = client.db('basdat');
    const collection = database.collection('hp');

    const cursor = collection.find();
    const data = await cursor.toArray();

    res.render('compare', { data, comparisonResult: null });
  } catch (error) {
    console.error('Error rendering comparison page', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/compare', async (req, res) => {
  try {
    const database = client.db('basdat');
    const collection = database.collection('hp');

    const model1 = req.body.model1;
    const model2 = req.body.model2;

    const result1 = await collection.findOne({ model: model1 });
    const result2 = await collection.findOne({ model: model2 });

    if (!result1 || !result2) {
      return res.status(404).send('One or both smartphones not found');
    }

    res.render('compare', { data: [], comparisonResult: { result1, result2 } });
  } catch (error) {
    console.error('Error comparing smartphones', error);
    res.status(500).send('Internal Server Error');
  }
});

  

app.get('/', async (req, res) => {
  const searchFilter = req.query.q;

  await connectDB();
  await displayData(res, searchFilter);
});
function isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
