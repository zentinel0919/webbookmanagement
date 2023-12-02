var express = require('express');
const multer = require('multer');
var env = require('dotenv').config();
var ejs = require('ejs');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const upload = multer({ dest: path.join(__dirname, 'views', 'assets', 'images') });
const puppeteer = require('puppeteer');
const axios = require('axios');
const cors = require('cors');


app.use(cors());

app.use(session({
  secret: 'kahitano',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({ 
    url: 'mongodb+srv://harvey:natividad@cluster0.xcod1uv.mongodb.net/test', // Replace with your MongoDB connection string
    collectionName: 'sessions',
    ttl: 60 * 60, // Session TTL (optional)
    client: prisma, // Prisma instance (optional)
  }),
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/views'));

var index = require('./routes/index');
app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});


app.post('/simulate-interview', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const response = await axios.post('http://localhost:5000/simulate-interview', {
      prompt: prompt
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.post('/builder-letter', async (req, res) => {

  const generatedResumeHTML = generateResumeHTML(formData);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(generatedResumeHTML);
  const pdfBuffer = await page.pdf();
  await browser.close();

  res.contentType('application/pdf');
  res.send(pdfBuffer);
});

app.get('/get-times-for-date', (req, res) => {
  const date = req.query.date;
});


app.post('/admin/job/add', upload.single('image'), (req, res) => {
  res.status(200).send('Book added successfully!');
});

app.post('/admin/job/edit/:jobId', upload.single('image'), (req, res) => {
  const jobId = req.params.jobId;
  res.status(200).send(`Job ${jobId} edited successfully!`);
});
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('Server is started on http://127.0.0.1:' + PORT);
});

// Get all announcements
app.get('/announcements', async (req, res) => {
  const announcements = await prisma.announcement.findMany();
  res.json(announcements);
});

// Add a new announcement (assuming you have middleware to check if user is admin)
app.post('/announcements', async (req, res) => {
  const { title, content, image, date } = req.body;
  const newAnnouncement = await prisma.announcement.create({
      data: { title, content, image, date }
  });
  res.json(newAnnouncement);
});

