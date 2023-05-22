var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client');
var crypto = require('crypto');
var prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const Chart = require('chart.js');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'views', 'assets', 'images'));
  },
  filename: function (req, file, cb) {
    // Generate a unique filename by adding a timestamp to the original filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});

const upload = multer({ storage: storage });


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



router.get('/', function (req, res, next) {
  return res.render('index.ejs');
});


//REGISTER
router.post('/', async function (req, res, next) {
  console.log(req.body);
  var personInfo = req.body;

  // Existing code...

  if (!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf) {
    res.send();
  } else {
    // Encrypt the password before storing it
    var encryptedPassword = encrypt(personInfo.password);

    // Check if the user is an admin
    var isAdmin = false;
    if (personInfo.email.includes("admin") || personInfo.email.endsWith("@admin.com")) {
      isAdmin = true;
    }

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
            gender: personInfo.gender,
            password: encryptedPassword, // Store the encrypted password
            passwordConf: encryptedPassword,
            id: c + 1,
            isAdmin: isAdmin, // Set isAdmin based on the condition
          },
        });

        console.log('Success');
        res.send({ Success: 'You are registered. You can login now.' });
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
    const bookCount = await prisma.book.count();

    // Render the admin dashboard with user and book counts
    res.render('admin.ejs', { name: userData.username, email: userData.email, userCount, bookCount });
  } catch (error) {
    console.error('Error retrieving admin dashboard data:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

});





router.get('/admin/book', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var books = await prisma.book.findMany();

    // Render the book management page
    return res.render('manage_book.ejs', { books });
  }
});


//ADD BOOK
const { v4: uuidv4 } = require('uuid');

router.post('/admin/book/add', upload.single('image'), async function (req, res, next) {
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
      var { title, author, genre, description } = req.body;
      var defaultImage = 'book.png';
      var image = req.file ? req.file.filename : defaultImage;
      var bookId = uuidv4(); // Generate a unique ID for the book

      var newBook = await prisma.book.create({
        data: {
          id: bookId,
          title,
          author,
          genre,
          description,
          image,
        },
      });

      res.redirect('/admin/book');
    }
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



//EDIT BOOK
router.post('/admin/book/edit/:id', upload.single('image'), async function (req, res, next) {
  var userId = req.session.userId;
  var bookId = req.params.id
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var { title, author, genre, description } = req.body;
    var bookId = req.params.id;
    
    var defaultImage = 'book.png';
    var image = req.file ? req.file.filename : defaultImage;

    var updatedBook = await prisma.book.update({
      where: {
        id: bookId,
      },
      data: {
        title,
        author,
        genre,
        description,
        image: image !== null ? image : undefined,
      },
    });

    res.redirect('/admin/book');
  }
});



//DELETE BOOK
router.post('/admin/book/delete/:id', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!data || !data.isAdmin) {
    res.redirect('/');
  } else {
    var bookId = req.params.id;

    try {
      // Check if the book is favorited by any users
      const favoritedByUsers = await prisma.favoriteBook.findMany({
        where: {
          bookId,
        },
      });

      if (favoritedByUsers.length > 0) {
        // Delete the book from favorite lists of all users
        await prisma.favoriteBook.deleteMany({
          where: {
            bookId,
          },
        });
      }

      // Delete the book
      await prisma.book.delete({
        where: {
          id: bookId,
        },
      });

      res.redirect('/admin/book');
    } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
});





//BOOKS DETAILS
// Render book details
router.get('/books/:bookId', async (req, res) => {
  const { bookId } = req.params;

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.render('book_details.ejs', { book });
  } catch (error) {
    console.error('Error retrieving book details:', error);
    res.status(500).json({ error: 'Something went wrong' });
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


//LOGIN
router.post('/login', async function (req, res, next) {
  var userId = req.session.userId;
  var data = await prisma.user.findUnique({
    where: { email: req.body.email },
  });
  
  if (data) {
    // Decrypt the stored password
    var decryptedPassword = decrypt(data.password);

    if (decryptedPassword == req.body.password) {
      req.session.userId = data.id;
      res.send({ Success: 'Success!' });
    } else {
      res.send({ Success: 'Wrong password!' });
    }
  } else {
    res.send({ Success: 'This Email is not registered!' });
  }
});



//DIRECTORY
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
        const bookCount = await prisma.book.count();
    
        // Render the admin dashboard with user and book counts
        return res.render('admin.ejs', { name: data.username, email: data.email, userCount, bookCount });
      } else {

        // Render the user dashboard
        var books = await prisma.book.findMany();
        return res.render('user.ejs', { userId: userId, name: data.username, email: data.email, books });
      }
    }
  }
});


// EDIT PROFILE
router.get('/user/profile', async function (req, res, next) {
  var userId = req.session.userId;

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
      return res.render('edit_profile.ejs', { user });
    }
  }
});



router.post('/profile', async function (req, res, next) {
  var userId = req.session.userId;
  var { username, email, password, newPassword, confirmPassword } = req.body;

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
          password: encryptedPassword,
        },
      });

      res.send({ Success: 'Profile updated successfully!' });
    }
  }
});



// Add a book to the user's favorite list
router.post('/user/favorite', async (req, res) => {
  const { userId, bookId } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if the book is already in the user's favorite list
    const isBookFavorite = await prisma.favoriteBook.findFirst({
      where: { userId: parseInt(userId), bookId },
    });

    if (isBookFavorite) {
      
      return res.status(400).json({ error: 'Book already in favorite list' });
    }

    // Add the book to the user's favorite list
    const createdFavoriteBook = await prisma.favoriteBook.create({
      data: {
        userId: parseInt(userId),
        bookId,
        title: book.title,
        author: book.author,
        genre: book.genre,
        image: book.image,
      },
    });

    res.json({ favoriteBook: createdFavoriteBook });
  } catch (error) {
    console.error('Error adding book to favorite list:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



router.delete('/user/favorite', async (req, res) => {
  const { userId, bookId } = req.query;

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

    const deletedFavoriteBook = await prisma.favoriteBook.delete({
      where: { userId_bookId: { userId: parsedUserId, bookId } },
    });

    res.json({ deletedFavoriteBook });
  } catch (error) {
    console.error('Error removing book from favorite list:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});




router.get('/user/favorites', async (req, res) => {
  try {
    const userId = req.session.userId;
    const favoriteBooks = await prisma.favoriteBook.findMany({
      where: { userId: parseInt(userId) },
      include: { book: { select: { title: true, author: true, genre: true, image: true} } },
    });

    // Retrieve the user's name from the session or any other source
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

    res.render('favorite.ejs', { favoriteBooks: favoriteBooks, name: user.username });
  } catch (error) {
    console.error('Error retrieving favorite books:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});




//LOGOUT
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
