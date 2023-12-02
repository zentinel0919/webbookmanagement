const multer = require('multer');
var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client');
var crypto = require('crypto');
var prisma = new PrismaClient();
const path = require('path');
const Joi = require('joi');
const Chart = require('chart.js');
const rasaClient = require('../rasaClient');
const smsHelper = require('../smsHelper');
const axios = require('axios');
const nodemailer = require('nodemailer');



const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  passwordConf: Joi.string().required(),
  gender: Joi.string().allow('', null),
});


const fs = require('fs');

const announcementStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'views', 'assets', 'announcements');
    console.log("Trying to save to:", dir); // Log the directory path
    
    // Check if directory exists, if not, create it
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});


const announcementUpload = multer({ storage: announcementStorage });

const divBoxStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'views', 'assets', 'divbox1');
    console.log("Trying to save to:", dir); // Log the directory path
    
    // Check if directory exists, if not, create it
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});

const divBoxUpload = multer({ storage: divBoxStorage });


const divBox2Storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'views', 'assets', 'divbox2');
    console.log("Trying to save to:", dir); // Log the directory path
    
    // Check if directory exists, if not, create it
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});

const divBox2Upload = multer({ storage: divBox2Storage });


const userProfilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'views', 'assets', 'userProfilePics');
    
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});

const userProfilePicUpload = multer({ storage: userProfilePicStorage });


const userResumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'views', 'assets', 'userResumes');
    
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});

const userResumeUpload = multer({ 
  storage: userResumeStorage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDFs are allowed'));
    }
    cb(null, true);
  }
});





const uploadErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    console.error("Multer error:", error);
    res.status(500).send("Error uploading file.");
  } else if (error) {
    // An unknown error occurred when uploading.
    console.error("Unknown upload error:", error);
    res.status(500).send("Error uploading file.");
  } else {
    // Everything went fine.
    next();
  }
}

function determineIfUserIsAdminSomehow(req) {
  // Check if the user is authenticated and has an "isAdmin" property in their session
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return true;
  }
  return false;
}


// Caesar cipher encryption function
function encrypt(plaintext) {
  var cipher = crypto.createCipher('aes192', 'your-secret-key');
  var encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Caesar cipher decryption function
function decrypt(ciphertext) {
  var decipher = crypto.createDecipher('aes192', 'your-secret-key');
  var decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


router.get('/admin/homepage', async (req, res) => {
  try {
      const userId = req.session.userId;

      // Check if the user is logged in and is an admin
      const user = await prisma.user.findUnique({
          where: {
              id: userId,
          },
      });

      if (!user || !user.isAdmin) {
          return res.redirect('/');
      }

      // Fetch announcements and div boxes
      const announcements = await prisma.announcement.findMany({
        orderBy: {
            date: 'desc'
        }
    });
    
      const divBoxImages = await prisma.DivBox.findMany();
      const divBox2Images = await prisma.DivBox2.findMany();

      // Render the admin homepage with fetched data
      res.render('homepage-admin.ejs', { announcements, divBoxImages, divBox2Images });
  } catch (error) {
      console.error('Error fetching data for admin homepage:', error);
      res.status(500).json({ error: 'Something went wrong' });
  }
});



router.post('/admin/divbox/add', divBoxUpload.single('image'), async (req, res) => {
  try {
      const image = req.file ? `/assets/divbox1/${req.file.filename}` : null;

      // Fetch the existing record
      const existingDivBox = await prisma.divBox.findFirst();

      // If there's an existing record, delete it
      if (existingDivBox) {
          await prisma.divBox.delete({
              where: { id: existingDivBox.id }
          });
      }

      // Create a new record
      await prisma.divBox.create({
          data: { image }
      });

      res.redirect('/admin/homepage');
  } catch (error) {
      console.error('Error updating DivBox image:', error);
      res.status(500).json({ error: 'Something went wrong' });
  }
});


// Add new image for DivBox2
// Add new image for DivBox2
router.post('/admin/divbox2/add', divBox2Upload.single('image'), async (req, res) => {
  try {
      const image = req.file ? `/assets/divbox2/${req.file.filename}` : null;

      // Fetch the existing record
      const existingDivBox2 = await prisma.divBox2.findFirst();

      // If there's an existing record, delete it
      if (existingDivBox2) {
          await prisma.divBox2.delete({
              where: { id: existingDivBox2.id }
          });
      }

      // Create a new record
      await prisma.divBox2.create({
          data: { image }
      });

      res.redirect('/admin/homepage');
  } catch (error) {
      console.error('Error updating DivBox2 image:', error);
      res.status(500).json({ error: 'Something went wrong' });
  }
});







router.post('/admin/announcement/add', announcementUpload.single('image'), async (req, res) => {
  const { title, content, date } = req.body;
  const image = req.file ? `/assets/announcements/${req.file.filename}` : null; // Modify this line
  await prisma.announcement.create({
      data: {
          title,
          content,
          date: new Date(),
          image
      }
  });
  res.redirect('/admin/homepage');
});




router.post('/admin/announcement/edit/:announcementId', announcementUpload.single('image'), async (req, res) => {
  const announcementId = req.params.announcementId;
  const { title, content, date } = req.body;
  const image = req.file ? '/assets/announcements/' + req.file.filename : null;
  await prisma.announcement.update({
      where: { id: announcementId },
      data: {
          title,
          content,
          date: new Date(),
          image
      }
  });
  res.redirect('/admin/homepage'); // Redirect to admin dashboard or wherever you want
});


router.post('/admin/announcement/delete/:announcementId', async (req, res) => {
  const announcementId = req.params.announcementId;
  await prisma.announcement.delete({
      where: { id: announcementId }
  });
  res.redirect('/admin/homepage'); // Redirect to admin dashboard or wherever you want
});






router.get('/', function (req, res, next) {
  return res.render('index.ejs');
});


// Route to add available dates
router.post('/add-available-date', async (req, res) => {
  const { date, times } = req.body;
  try {
    const newDate = await prisma.availableDate.create({
      data: {
        date: new Date(date),
        times: times,
      },
    });
    res.json(newDate);
  } catch (error) {
    console.error('Error adding available date:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Route to get available dates
router.get('/get-available-dates', async (req, res) => {
  try {
    const availableDates = await prisma.availableDate.findMany();
    res.json(availableDates);
  } catch (error) {
    console.error('Error fetching available dates:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.get('/get-times-for-date', async (req, res) => {
  const date = req.query.date;
  try {
      const availableDate = await prisma.availableDate.findFirst({
          where: {
              date: new Date(date)
          }
      });
      if (availableDate) {
          res.json(availableDate.times);
      } else {
          res.status(404).json({ error: 'Date not found' });
      }
  } catch (error) {
      console.error('Error fetching times for date:', error);
      res.status(500).json({ error: 'Something went wrong' });
  }
});



// Helper function to format the date
function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

router.get('/counseling', async function (req, res, next) {
  try {
    const userId = req.session.userId; // Assuming you have user sessions

    if (!userId) {
      res.redirect('/');
    } else {
      const data = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!data) {
        res.redirect('/');
      } else {
        if (data.isAdmin) {
          
          const availableDates = await prisma.availableDate.findMany({
            orderBy: {
              date: 'asc',
            },
          });
          
          const allMeetings = await prisma.meeting.findMany({
            orderBy: {
              date: 'asc',
            },
            include: {
              user: true,
            },
          });

          // Format the date for each meeting
          allMeetings.forEach(meeting => {
            meeting.date = formatDate(meeting.date);
          });

          return res.render('counseling-admin.ejs', {
            user: data,
            meetings: allMeetings,
            availableDates: availableDates,
          });
        } else {
          const meetings = await prisma.meeting.findMany({
            where: {
              userId: userId,
            },
            orderBy: {
              date: 'asc',
            },
            include: {
              user: true,
            },
          });

          // Format the date for each meeting
          meetings.forEach(meeting => {
            meeting.date = formatDate(meeting.date);
          });

          return res.render('counseling.ejs', {
            user: data,
            meetings: meetings,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error retrieving meeting appointments:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



router.post('/schedule-meeting', async (req, res) => {
  const { meetingDate, meetingTime, meetingPurpose } = req.body;
  const userId = req.session.userId;

  // Split the meetingTime into startTime and endTime
  const [startTime, endTime] = meetingTime.split('-');

  try {
    const newMeeting = await prisma.meeting.create({
      data: {
        date: new Date(meetingDate),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        purpose: meetingPurpose,
        userId: userId,
        createdAt: new Date(),
      },
    });

    res.redirect('/counseling');
  } catch (error) {
    console.error('Error creating meeting appointment:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



router.post('/confirm-meeting/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  try {
    // Update the meeting in the database to set isConfirm to true
    await prisma.meeting.update({
      where: {
        id: meetingId,
      },
      data: {
        isConfirm: true,
      },
    });
    res.redirect('/counseling'); // Redirect to the counseling page
  } catch (error) {
    console.error('Error confirming meeting:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Route to mark a meeting as done
router.post('/mark-as-done/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  try {
    // Update the meeting in the database to set isDone to true
    await prisma.meeting.update({
      where: {
        id: meetingId,
      },
      data: {
        isDone: true,
      },
    });
    res.redirect('/counseling'); // Redirect to the counseling page
  } catch (error) {
    console.error('Error marking meeting as done:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



router.post('/generate-text', async (req, res) => {
  try {
    // Assuming that req.body already contains the 'prompt' key
    const userId = req.session.userId;
    if (!userId) {
      res.redirect('/');
    } else {
    const response = await axios.post('http://localhost:5000/openai', req.body);
    res.json(response.data);
    }
  } catch (error) {
    console.error(error.response.data); // Log the error response data from Flask server
    res.status(500).json({ error: error.message });
  }
});



router.get('/interview', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.redirect('/');
    } else {
      // Reset the conversation history on Flask server
      await axios.get('http://localhost:5000/reset_conversation');
      // Then render the interview page
      res.render('interview-simulation.ejs');
    }
  } catch (error) {
      console.error('Error resetting conversation history:', error);
      res.status(500).send('Error loading the interview page');
  }
});


router.get('/builder', function (req, res, next) {
  return res.render('builder.ejs');
});


function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

//REGISTER
router.post('/', async function (req, res, next) {
  console.log(req.body);
  var personInfo = req.body;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    auth: {
      user: 'careercenterstaff34@gmail.com',
      pass: 'flfm pmii hthz djku',
    },
  });
  
  if (!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf) {
    res.send();
  } else {
    // Encrypt the password before storing it
    var encryptedPassword = encrypt(personInfo.password);

    // Check if the user is an admin
    var isAdmin = false;


    if (personInfo.password == personInfo.passwordConf) {
      var existingUser = await prisma.user.findUnique({
        where: {
          email: personInfo.email,
        },
      });

      if (!existingUser) {
        var c = await prisma.user.count();
        var newPerson = await prisma.user.create({
          data: {
            unique_id: c + 1,
            email: personInfo.email,
            username: personInfo.username,
            phone: personInfo.phone,
            gender: personInfo.gender,
            program: personInfo.program,
            password: encryptedPassword, // Store the encrypted password
            passwordConf: encryptedPassword,
            id: c + 1,
            isAdmin: isAdmin, // Set isAdmin based on the condition
          },
        });
        const verificationToken = generateRandomToken();
        await prisma.user.update({
          where: { id: newPerson.id },
          data: { 
            verificationToken: verificationToken },
        });
        const verificationLink = `http://127.0.0.1:3000/verify?token=${verificationToken}`;
        const mailOptions = {
          from: 'careercenterstaff34@gmail.com',
          to: personInfo.email,
          subject: 'Email Verification',
          html: `
          <p>Dear ${personInfo.username},</p>
          <p>Thank you for registering with the Career Center! To complete your registration and access our services, please click on the link below to verify your email address:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>Please note that this link is valid for a limited time. If you encounter any issues or did not register for an account, please disregard this email.</p>
          <p>Thank you for registering!</p>
          <p>Best Regards,<br>Career Center Team</p>
        `,
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.error('Error sending verification email:', error);
            res.status(500).json({ error: 'Error sending verification email' });
          } else {
            console.log('Verification email sent: ' + info.response);
            res.send({ Success: 'You are registered. Check your email for verification.' });
          }
        });
        console.log('Success');
        res.send({ Success: 'You are registered. Check your email for verification.' });
      } else {
        res.send({ Success: 'Email is already used.' });
      }
    } else {
      res.send({ Success: 'Password does not match.' });
    }
  }


// ADMIN DASHBOARD
router.get('/admin', async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect('/');
    }

    const userData = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userData || !userData.isAdmin) {
      return res.redirect('/');
    }

    const userCount = await prisma.user.count();
    const jobCount = await prisma.job.count();

    // Render the admin dashboard with user and book counts
    res.render('admin.ejs', { name: userData.username, email: userData.email, userCount, jobCount });
  } catch (error) {
    console.error('Error retrieving admin dashboard data:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

});



router.get('/verify', async function (req, res, next) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is missing' });
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    return res.render('verificationFailed.ejs');
  }

  // Update the user to mark them as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationToken: null },
  });

  // Redirect or respond with a success message as needed
  return res.render('verificationSuccess.ejs');
});






router.get('/admin/job', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var jobs = await prisma.job.findMany();

    // Render the book management page
    return res.render('manage_book.ejs', { jobs });
  }
});




router.get('/jobs/:jobId', async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const userId = req.session.userId; // Assuming the user ID is stored in the session

    if (!userId) {
      // User is not logged in
      return res.redirect('/');
    } else {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        // User not found
        return res.redirect('/');
      } else if (user.isAdmin) {
          res.render('job-details-admin.ejs', { job, user, userId: userId });
      } else {
          res.render('book_details.ejs', { job, user, userId: userId });
      }
    }
  } catch (error) {
    console.error('Error retrieving job details:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});




//ADD BOOK
const { v4: uuidv4 } = require('uuid');

router.post('/admin/job/add', async function (req, res, next) {
  try {
    var userId = req.session.userId;
    var data = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!data || !data.isAdmin) {
      res.redirect('/');
    } else {
      var { title, company, program, location, description } = req.body;
      var defaultImage = 'book.png';
      var jobId = uuidv4(); // Generate a unique ID for the book

      var newJob = await prisma.job.create({
        data: {
          id: jobId,
          title,
          company,
          program,
          location,
          description,
        },
      });

      res.redirect('/admin/job');
    }
  } catch (error) {
    console.error('Error adding job:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



//EDIT BOOK
router.post('/admin/job/edit/:id', async function (req, res, next) {
  var userId = req.session.userId;
  var jobId = req.params.id
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var { title, company, program, location, description,} = req.body;
    var jobId = req.params.id;
    

    var updatedJob = await prisma.job.update({
      where: {
        id: jobId,
      },
      data: {
        title,
        company,
        program,
        location,
        description,
      },
    });

    res.redirect('/admin/job/');
  }
});



//DELETE BOOK
router.post('/admin/job/delete/:id', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var jobId = req.params.id;

    try {

      const applications = await prisma.jobApplication.deleteMany({
        where: {
          jobId: jobId,
        },
      });

      // Check if the book is favorited by any users
      const favoritedByUsers = await prisma.favoriteJob.findMany({
        where: {
          jobId,
        },
      });

      if (favoritedByUsers.length > 0) {
        // Delete the book from favorite lists of all users
        await prisma.favoriteJob.deleteMany({
          where: {
            jobId,
          },
        });
      }

      // Delete the book
      await prisma.job.delete({
        where: {
          id: jobId,
        },
      });

      res.redirect('/admin/job');
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
});





//VIEW USERS
router.get('/admin/users', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var users = await prisma.user.findMany();

    // Render the user management page
    return res.render('manage_user.ejs', { users });
  }
});



//EDIT USER
router.get('/admin/user/edit/:id', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var userId = parseInt(req.params.id);
    var user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // Render the edit user form
    return res.render('edit_user.ejs', { user });
  }
});

router.post('/admin/user/edit/:id', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var userId = parseInt(req.params.id);
    var { username, email, isAdmin } = req.body;

    var updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        username,
        email,
        isAdmin: isAdmin === 'on', // Convert string to boolean
      },
    });

    res.redirect('/admin/users');
  }
});


router.post('/admin/user/delete/:id', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var userId = parseInt(req.params.id);

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    res.redirect('/admin/users');
  }
});


// LOGIN
router.post('/login', async function (req, res, next) {
  var userId = req.session.userId;

  const { error } = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).validate(req.body);

  if (error) {
    res.send({ Error: error.details[0].message });
    return;
  }

  var data = await prisma.user.findUnique({
    where: { email: req.body.email },
  });

  if (data) {
    if (data.isVerified) {
      var decryptedPassword = decrypt(data.password);

      if (decryptedPassword == req.body.password) {
        req.session.userId = data.id;
        res.send({ Success: 'Success!' });
      } else {
        res.send({ Success: 'Wrong password!' });
      }
    } else {
      res.send({ Success: 'Email not verified. Check your email for verification instructions.' });
    }
  } else {
    res.send({ Success: 'This Email is not registered!' });
  }
});




router.get('/directory', async function (req, res, next) {
  var userId = req.session.userId; // Assuming the user ID is stored in the session

  if (!userId) {
    res.redirect('/');
  } else {
    var data = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!data) {
      res.redirect('/');
    } else {
      if (data.isAdmin) {
        const userCount = await prisma.user.count();
        const jobCount = await prisma.job.count();
    
        // Render the admin dashboard with user and book counts
        return res.render('admin.ejs', { name: data.username, email: data.email, userCount, jobCount });
      } else {



        const announcements = await prisma.announcement.findMany({
          orderBy: {
              date: 'desc'
          }
      });
      
        // Render the user dashboard
        var jobs = await prisma.job.findMany();
        return res.render('user.ejs', { userId: userId, name: data.username, email: data.email, jobs, announcements });
      }
    }
  }
});




router.get('/ojt-search', async function (req, res, next) {
  const userId = parseInt(req.session.userId); // Convert to integer since userId is an integer in your Prisma model

  if (!userId) {
    return res.redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.redirect('/');
  }

  if (user.isAdmin) {
    // Admin dashboard logic (if any)
  } else {
    const allJobs = await prisma.job.findMany();

    // Fetch user's favorite jobs with related job details
    const favoriteJobs = await prisma.favoriteJob.findMany({
      where: { userId: userId },
      include: { job: true },
    });

    // Dummy content-based recommendation logic (you can replace this with a more sophisticated algorithm)
    const recommendedJobs = allJobs.filter(job => 
      favoriteJobs.some(favoriteJob => 
        favoriteJob.program === job.program ||
        favoriteJob.company === job.company ||
        favoriteJob.location === job.location
      )
    );

    // Ensure recommended jobs are not duplicated in the general job list
    const jobs = allJobs.filter(job => !recommendedJobs.includes(job));

    return res.render('ojt-search.ejs', { userId: userId, name: user.username, email: user.email, recommendedJobs, jobs: allJobs });
  }
});






router.post('/user/uploadResume/:jobId', userResumeUpload.single('resume'), async (req, res) => {
  const { jobId } = req.params;
  try {
    const userId = req.session.userId;

    const resume = req.file ? `/assets/userResumes/${req.file.filename}` : null;

    if (!resume) {
      return res.status(400).send("No resume provided.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    // Assuming you have a JobApplication model or similar to store the resume path
    await prisma.jobApplication.create({
      data: {
        userId: userId,
        jobId: jobId,
        username: user.username,
        email: user.email,
        program: user.program,
        title: job.title,
        resume: resume
      }
    });

    res.render('book_details.ejs', { job, user, userId: userId });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});






// EDIT PROFILE
router.get('/user/profile', async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.redirect('/');
    } else {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        res.redirect('/');
      } else {
        const favoriteJobs = await prisma.favoriteJob.findMany({
          where: { userId: parseInt(userId) },
          include: { job: { select: { title: true, company: true, program: true} } },
        });

        // Retrieve the user's name from the session or any other source
        const userWithUsername = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });

        res.render('edit_profile.ejs', {
          user: user,
          favoriteJobs: favoriteJobs,
          name: userWithUsername.username,
        });
      }
    }
  } catch (error) {
    console.error('Error retrieving profile data:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.post('/user/uploadProfilePic', userProfilePicUpload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.session.userId;
    const image = req.file ? `/assets/userProfilePics/${req.file.filename}` : null;

    if (!image) {
      return res.status(400).send("No image provided.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profilePic: image }
    });

    res.redirect('/user/profile');
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



router.post('/profile', async function (req, res, next) {
  var userId = req.session.userId;
  var { username, email, phone, password, newPassword, confirmPassword } = req.body;

  if (!userId) {
    res.redirect('/');
  } else {
    var user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.redirect('/');
    } else {
      // Verify if the current password matches
      var decryptedPassword = decrypt(user.password);

      if (password !== decryptedPassword) {
        return res.send({ Success: 'Current password is incorrect!' });
      }

      // Check if the new password and confirm password match
      if (newPassword !== confirmPassword) {
        return res.send({ Success: 'New password and confirm password do not match!' });
      }

      // Encrypt the new password
      var encryptedPassword = encrypt(newPassword);

      // Update the user's profile
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          username,
          email,
          phone,
          password: encryptedPassword,
        },
      });

      return res.render('edit_profile.ejs', { user });
    }
  }
});



// Add a book to the user's favorite list
router.post('/user/profile', async (req, res) => {
  const { userId, jobId } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the book is already in the user's favorite list
    const isJobFavorite = await prisma.favoriteJob.findFirst({
      where: { userId: parseInt(userId), jobId },
    });

    if (isJobFavorite) {
      
      return res.status(400).json({ error: 'Job already in favorite list' });
    }

    // Add the book to the user's favorite list
    const createdFavoriteJob = await prisma.favoriteJob.create({
      data: {
        userId: parseInt(userId),
        jobId,
        title: job.title,
        company: job.company,
        program: job.program,
        location: job.location
      },
    });

    res.json({ favoriteJob: createdFavoriteJob });
  } catch (error) {
    console.error('Error adding book to favorite list:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



router.delete('/user/profile', async (req, res) => {
  const { userId, jobId } = req.query;

  try {
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parsedUserId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletedFavoriteJob = await prisma.favoriteJob.delete({
      where: { userId_jobId: { userId: parsedUserId, jobId } },
    });

    res.json({ deletedFavoriteJob });
  } catch (error) {
    console.error('Error removing book from favorite list:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});




router.get('/logout', function (req, res, next) {
  console.log('logout');
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

module.exports = router;

