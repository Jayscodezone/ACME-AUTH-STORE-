const {
  client,
  createTables,
  createUser,
  createProduct,
  createFavorite,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  destroyFavorite,
  authenticate,
  findUserWithToken,
} = require('./db');
const express = require('express');
const app = express();
const path = require('path');
// Load environment variables from .env file
require('dotenv').config();
//MIDDLEWARE 
app.use(express.json());

// //JWT for Middleware 
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//    const token = authHeader && authHeader.split(' ')[1];
//   if (!token) return res.sendStatus(401).json({ error: 'Access denied. No token provided.' });


//    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) return res.sendStatus(403).json({ error: 'Invalid token.' });
//     req.user = user;
//    next();
//   });
//  };

//for deployment only

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'))); 

 //creating the login to deliver the token 
 const isLoggedIn = async(req, res, next)=> {
  try {
    req.user = await findUserWithToken(req.headers.authorization);
   next();
  }
  catch(ex){
   next(ex);
  }
 };

// routes for login and auth

app.post('/api/auth/login', async(req, res, next)=> {
  try {
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

// routes for authentication 
app.get('/api/auth/me', isLoggedIn, async(req, res, next)=> {
  try {
    res.send(req.user);
    // res.send(await findUserWithToken(req.headers.authorization));
  }
  catch(ex){
    next(ex);
  }
});
// get products
app.get('/api/products', async(req, res, next)=> {
  try {
    res.send(await fetchProducts());
  }
  catch(ex){
    next(ex);
  }
});

// get users 
app.get('/api/users', async(req, res, next)=> {
  try {
    res.send(await fetchUsers());
  }
  catch(ex){
    next(ex);
  }
});

// fetching the favorites 
app.get('/api/users/:id/favorites', isLoggedIn, async(req, res, next)=> {
  try {
    if(req.params.id !== req.user.id){
      const error = Error('not authorized');
      error.status = 401;
      throw error;
    }
    res.send(await fetchFavorites(req.params.id));
  }
  catch(ex){
    next(ex);
  }
});
// delete favorites
app.delete('/api/users/:user_id/favorites/:id',isLoggedIn,  async(req, res, next)=> {
  try {
    if(req.params.userId !== req.user.id){
      const error = Error('not authorized');
      error.status = 401;
      throw error;
    }
    await destroyFavorite({user_id: req.params.user_id, id: req.params.id });
    res.sendStatus(204);
  }
  catch(ex){
    next(ex);
  }
});

app.post('/api/users/:id/favorites', isLoggedIn, async(req, res, next)=> {
  try {
    if(req.params.id !== req.user.id){
      const error = Error('not authorized');
      error.status = 401;
      throw error;
    }
    res.status(201).send(await createFavorite({ user_id: req.params.id, product_id: req.body.product_id}));
  }
  catch(ex){
    next(ex);
  }
  //error handeling middlware
  app.use((err, req, res, next)=> {
    console.log(err);
    res.status(err.status || 500).send({ error: err.message || err });
  });
});

// initializing an seeding database
const init = async()=> {
  await client.connect();
  console.log('connected to database');
  await createTables();
  console.log('tables created');

  const [moe, lucy, ethyl, curly, foo, bar, bazz, quq, fip] = await Promise.all([
    createUser({ username: 'moe', password: 'm_pw'}),
    createUser({ username: 'lucy', password: 'l_pw'}),
    createUser({ username: 'ethyl', password: 'e_pw'}),
    createUser({ username: 'curly', password: 'c_pw'}),
    createProduct({ name: 'foo' }),
    createProduct({ name: 'bar' }),
    createProduct({ name: 'bazz' }),
    createProduct({ name: 'quq' }),
    createProduct({ name: 'fip' })
  ]);
// base code 
 console.log(await fetchUsers());
 console.log(await fetchProducts());
  
 console.log(await fetchFavorites(moe.id));
 const favorite = await createFavorite({ user_id: moe.id, product_id: foo.id });
 await deleteFavorite({ user_id: moe.id, id: userSkills[0].id});
 console.log(await fetchFavorites(moe.id));


  //listening on port 3000
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, ()=> console.log(`listening on port ${PORT}`));
};

init();

