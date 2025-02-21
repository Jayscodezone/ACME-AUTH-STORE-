const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://janayacooper:1116@localhost/acme_auth_store_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT || "supersecretkey";

// creating the tables 
const createTables = async()=> {
  const SQL = `
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS products;
    CREATE TABLE users(
      id UUID PRIMARY KEY,
      username VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
    CREATE TABLE products(
      id UUID PRIMARY KEY,
      name VARCHAR(20)
    );
    CREATE TABLE favorites(
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      product_id UUID REFERENCES products(id) NOT NULL,
      CONSTRAINT unique_user_id_and_product_id UNIQUE (user_id, product_id)
    );
  `;
  await client.query(SQL);
};

// creating the user 

const createUser = async({ username, password})=> {
  const hashedPassword = await bcrypt.hash(password, 10);
  const SQL = `
    INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    hashedPassword,
  ]);
  return response.rows[0];
};
// Create Authentication 
const authenticate = async ({ username, password }) => {
  const SQL = `
    SELECT id, username,password FROM users WHERE username=$1;
  `;
  const response = await client.query(SQL, [username]);
  if (
    !response.rows.length ||
    !(await bcrypt.compare(password, response.rows[0].password))
  ) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  const token = jwt.sign({ id: response.rows[0].id }, JWT);
  return { token };
};


// fetch the user 

const fetchUsers = async()=> {
  const SQL = `
    SELECT id, username FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

// Find user by Token 
const findUserWithToken = async (token) => {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  } catch (ex) {
    const error = Error("Invalid username or password: not authorized!");
    error.status = 401;
    throw error;
  }
  const SQL = `
    SELECT id, username
    FROM users
    WHERE id = $1
  `;
  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
    const error = Error("Invalid username or password: not authorized!");
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

// creating the products 

const createProduct = async({ name })=> {
  const SQL = `
    INSERT INTO products(id, name) VALUES($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};


// fetch products 

const fetchProducts = async()=> {
  const SQL = `
    SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

// creating the favorites 
const createFavorite = async({ user_id, product_id, favorite_id})=> {
  const SQL = `
    INSERT INTO favorites(id, user_id, product_id) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, product_id, favorite_id]);
  return response.rows[0];
};

// fetching favorite 
const fetchFavorites = async(user_id)=> {
  const SQL = `
    SELECT * FROM favorites where user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};


// Destroying favorite 
const destroyFavorite = async({ user_id, id })=> {
  const SQL = `
    DELETE FROM favorites WHERE user_id=$1 AND id=$2
  `;
  await client.query(SQL, [user_id, id]);
};

// const authenticate = async({ username, password })=> {
//   const SQL = `
//     SELECT id, username FROM users WHERE username=$1;
//   `;
//   const response = await client.query(SQL, [username]);
//   if(!response.rows.length){
//     const error = Error('not authorized');
//     error.status = 401;
//     throw error;
//   }
//   return { token: response.rows[0].id };
// };

// const findUserWithToken = async(id)=> {
//   const SQL = `
//     SELECT id, username FROM users WHERE id=$1;
//   `;
//   const response = await client.query(SQL, [id]);
//   if(!response.rows.length){
//     const error = Error('not authorized');
//     error.status = 401;
//     throw error;
//   }
//   return response.rows[0];
// };






module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  createFavorite,
  destroyFavorite,
  authenticate,
  findUserWithToken,
};
