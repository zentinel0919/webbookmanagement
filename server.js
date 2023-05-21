var express = require('express');
var env = require('dotenv').config();
var ejs = require('ejs');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const upload = multer({ dest: 'views/assets/images' });

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


app.post('/admin/book/add', upload.single('image'), (req, res) => {
  // Access the uploaded file using req.file
  // Save the book details and file information to the database
  // Return a response to the client
  res.status(200).send('Book added successfully!');
});

app.post('/admin/book/edit/:bookId', upload.single('image'), (req, res) => {
  const bookId = req.params.bookId;
  // Access the uploaded file using req.file (if a new image was uploaded)
  // Update the book details and file information in the database
  // Return a response to the client
  res.status(200).send(`Book ${bookId} edited successfully!`);
});
// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('Server is started on http://127.0.0.1:' + PORT);
});
