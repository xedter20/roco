import express from 'express';
import cors from 'cors';

import config from './config.js';

import bodyParser from 'body-parser';

import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

import authRoute from './routes/auth.js';
import userRoute from './routes/userRoute.js';

let mySqlDriver = config.mySqlDriver;

// import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const app = express();
// for parsing application/json
app.use(
  bodyParser.json({
    limit: '50mb'
  })
);
// for parsing application/xwww-form-urlencoded
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true
  })
);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 1000000
  })
);

app.use(cors());
app.use(express.json());

app.use(express.static('public'));
app.use(express.static('files'));

app.use('/api/auth', authRoute);

app.use('/api/user', userRoute);

app.use('/static', express.static('public'));

app.post('/api/createLibrary', async (req, res) => {
  let { name, db_host, db_name, db_user, db_password, address } = req.body;

  const oldDbName = 'library_db_empty'; // Replace with your old database name
  const newDbName = `library_db_${db_name}`; // Replace with your new database name

  console.log({ newDbName });
  // Function to create a database
  const createDatabase = async newDbName => {
    const connection = await config.createDBSession({
      database: ''
    });

    try {
      await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${newDbName}\``
      );
      console.log(`Database ${newDbName} created or already exists.`);
    } catch (error) {
      console.error('Error creating database:', error);
      throw error;
    } finally {
      await connection.end();
    }
  };

  // Function to copy tables from the old database to the new one
  const copyTables = async (oldDbName, newDbName) => {
    // Create the new database if it doesn't exist
    await createDatabase(newDbName);

    // Connect to the old and new databases
    const oldDbConnection = await config.createDBSession({
      database: oldDbName
    });
    const newDbConnection = await config.createDBSession({
      database: newDbName
    });

    try {
      await mySqlDriver.execute(
        `
        INSERT INTO libraries 
        (name, db_host, db_name, db_user, db_password) 
        VALUES (?, ?, ?, ?, ?)

      `,
        [name, db_host, newDbName, db_user, db_password]
      );

      console.log(`Created new library entry`);

      // Fetch all table names from the old database
      const [tables] = await oldDbConnection.execute('SHOW TABLES');

      // Loop through all the tables and copy their data
      for (let table of tables) {
        const tableName = table[`Tables_in_${oldDbName}`]; // Extract the table name

        console.log(`Copying table: ${tableName}`);

        try {
          // Step 1: Copy table structure (CREATE TABLE LIKE)
          await newDbConnection.query(`
            CREATE TABLE IF NOT EXISTS ${newDbName}.${tableName} LIKE ${oldDbName}.${tableName};
          `);
          console.log(`Copied structure of table: ${tableName}`);

          // Step 2: Copy data (INSERT INTO SELECT)
          await newDbConnection.query(`
            INSERT INTO ${newDbName}.${tableName} SELECT * FROM ${oldDbName}.${tableName};
          `);
          console.log(`Copied data of table: ${tableName}`);
        } catch (error) {
          console.error(`Error copying table ${tableName}: ${error.message}`);
        }
      }

      console.log('All tables copied successfully!');
    } catch (error) {
      console.error('Error copying tables:', error);
      throw error;
    } finally {
      // Close the connections
      await oldDbConnection.end();
      await newDbConnection.end();
    }
  };

  try {
    await copyTables(oldDbName, newDbName);
    res.status(200).send('Tables copied successfully!');
  } catch (error) {
    res.status(500).send(`Error copying tables: ${error.message}`);
  }
});

app.post('/api/deleteLibrary', async (req, res) => {
  let { library_id } = req.body;

  try {
    let [result] = await mySqlDriver.execute(
      `
SELECT * FROM libraries WHERE library_id = ? 

    `,
      [library_id]
    );

    let { db_name } = result[0];

    console.log({ db_name });

    const newDbConnection = await config.createDBSession({
      database: db_name
    });

    await newDbConnection.execute(`
   DROP DATABASE ${db_name}
    `);

    await mySqlDriver.execute(
      `
    DELETE FROM libraries WHERE library_id = ?

    `,
      [library_id]
    );

    res.status(200).send('Tables deleted successfully!');
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error copying tables: ${error.message}`);
  }
});

app.post('/api/deleteUser', async (req, res) => {
  let { admin_id } = req.body;

  console.log({ admin_id });

  try {
    let [result] = await mySqlDriver.execute(
      `
DELETE FROM admin_account WHERE id = ? 

    `,
      [admin_id]
    );

    // await mySqlDriver.execute(`
    //   DROP TABLE IF EXISTS ${db_name};
    // `);

    // await mySqlDriver.execute(
    //   `
    // DELETE FROM libraries WHERE library_id = ?

    // `,
    //   [library_id]
    // );

    res.status(200).send(' deleted successfully!');
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error copying tables: ${error.message}`);
  }
});

app.post('/api/library/list', async (req, res) => {
  // let { name, db_host, db_name, db_user, db_password, address } = req.body;

  try {
    let [result] = await mySqlDriver.execute(
      `
     SELECT * FROM libraries 

     ORDER BY name DESC

    `,
      []
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).send(`Error copying tables: ${error.message}`);
  }
});

app.listen(config.port, async () => {
  // const oldDbName = 'library_db_empty'; // Replace with your old database name
  // const newDbName = 'library_db_sti'; // Replace with your new database name

  // const createDatabase = async newDbName => {
  //   const connection = await config.createDBSession({
  //     database: newDbName
  //   });

  //   try {
  //     await connection.execute(
  //       `CREATE DATABASE IF NOT EXISTS \`${newDbName}\``
  //     );
  //     console.log(`Database ${newDbName} created or already exists.`);
  //   } catch (error) {
  //     console.error('Error creating database:', error);
  //   } finally {
  //     await connection.end();
  //   }
  // };

  // // Function to copy all tables from old database to new database
  // const copyTables = async (oldDbName, newDbName) => {
  //   // Create the new database if it doesn't exist
  //   await createDatabase(newDbName);

  //   // Connect to the old and new databases
  //   const oldDbConnection = await config.createDBSession({
  //     database: oldDbName
  //   });

  //   const newDbConnection = await config.createDBSession({
  //     database: newDbName
  //   });

  //   try {
  //     // Fetch all table names from the old database

  //     const [tables] = await oldDbConnection.execute('SHOW TABLES');

  //     // Loop through all the tables and copy their data
  //     for (let table of tables) {
  //       const tableName = table[`Tables_in_${oldDbName}`]; // Extract the table name

  //       console.log(`Copying table: ${tableName}`);

  //       try {
  //         // Step 1: Copy table structure (CREATE TABLE LIKE)
  //         await newDbConnection.query(`
  //           CREATE TABLE IF NOT EXISTS ${newDbName}.${tableName} LIKE ${oldDbName}.${tableName};
  //         `);
  //         console.log(`Copied structure of table: ${tableName}`);

  //         // Step 2: Copy data (INSERT INTO SELECT)
  //         await newDbConnection.query(`
  //           INSERT INTO ${newDbName}.${tableName} SELECT * FROM ${oldDbName}.${tableName};
  //         `);
  //         console.log(`Copied data of table: ${tableName}`);
  //       } catch (error) {
  //         console.error(`Error copying table ${tableName}: ${error.message}`);
  //       }
  //     }

  //     console.log('All tables copied successfully!');
  //   } catch (error) {
  //     console.error('Error copying tables:', error);
  //   } finally {
  //     // Close the connections
  //     await oldDbConnection.end();
  //     await newDbConnection.end();
  //   }
  // };
  // await copyTables(oldDbName, newDbName);
  console.log(`DB Server is live`);
});
