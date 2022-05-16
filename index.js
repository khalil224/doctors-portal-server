const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1sb3y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('doctors_portal').collection('services');
    const bookingCollection = client.db('doctors_portal').collection('bookings');



    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services)
    });

    //Warning: 
    //this is not the proper way to query
    //After learning more about mongodb ,use aggregate lookup,pipeline,match,group
    app.get('/available', async (req, res) => {
      const date = req.query.date || 'May 11,2022';

      //step 1: get all services

      const services = await serviceCollection.find().toArray();

      //step 1:get the booking of that day
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();
      //step 3: for each service, find bookings for that service
      services.forEach(service => {
        //step 4: find booking for that service
        const serviceBookings = bookings.filter(b => b.treatment === service.name);
        //select slots for the service Bookings: ['','','']
        const booked = serviceBookings.map(s => s.slot);
        //step 6: select those slots that are not in booked slot
        const available = service.slots.filter(s => !booked.includes(s));
        //step 7: set available
        service.slots = available;
      })
      res.send(services)
    })

    /* 
        *API Naming Convention
        * app.get('/booking')//get all booking in this collection or get more than one or by filter or query
        * app.get('/booking')//get a specific booking
        * app.post('/booking') //add a new booking
        * app.patch('booking/:id')
        * app.delete('/booking/:id')
        */

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists })
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result })
    })

  }
  finally {

  }
}

run().catch(console.dir)



app.get('/', (req, res) => {
  res.send('this is a doctors portal');
})

app.listen(port, () => {
  console.log('doctors portal is running', port)
})