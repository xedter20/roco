import express from 'express';

import config from '../config.js';

let db = config.mySqlDriver;

const router = express.Router();

// Get user by ID

// Get all admin accounts
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`
   SELECT 
    admin_account.id AS admin_id,
    admin_account.username,
    admin_account.full_name,
    admin_account.phone_number,
    admin_account.address AS admin_address,
    admin_account.barangay_id,
    admin_account.city,
    admin_account.zip_code,
    admin_account.account_type,
    admin_account.school_id,
    admin_account.office_name,
    admin_account.email,
    admin_account.password,
    admin_account.verification_code,
    admin_account.verify_status,
    admin_account.library_id,
    admin_account.date_created,
    libraries.library_id AS library_id,
    libraries.name AS library_name,
    libraries.db_host,
    libraries.db_name,
    libraries.db_user,
    libraries.db_password,
    libraries.address AS library_address,
    libraries.created_at AS library_created_at
FROM 
    admin_account
INNER JOIN 
    libraries 
ON 
    admin_account.library_id = libraries.library_id;

      
  `);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get a specific admin account by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query(
      'SELECT * FROM admin_account WHERE id = ?',
      [id]
    );
    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Admin account not found' });
    }
    res.status(200).json({ success: true, data: results[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new admin account
router.post('/create', async (req, res) => {
  try {
    const {
      account_type,
      address,
      city,
      email,
      full_name,
      library_id,
      phone_number,
      username,
      zip_code
    } = req.body;

    let password = 'library123';

    const checkEmailQuery = `SELECT email FROM admin_account WHERE email = ?`;
    const [existingEmail] = await db.query(checkEmailQuery, [email]);

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists.'
      });
    }

    const query = `
       INSERT INTO admin_account (
        account_type,
        address,
        city,
        email,
        full_name,
        library_id,
        phone_number,
        username,
        password,
        barangay_id,
        zip_code,
        school_id,
        office_name
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ? , ? , ? ,? ,?,?
      );
      
      `;

    const [results] = await db.query(query, [
      account_type,
      address,
      city,
      email,
      full_name,
      library_id,
      phone_number,
      username,
      password,
      1,
      4500,
      2,
      ''
    ]);

    res.status(201).json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

// Update an existing admin account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      full_name,
      phone_number,
      address,
      barangay_id,
      city,
      zip_code,
      account_type,
      school_id,
      office_name,
      email,
      password,
      verification_code,
      verify_status,
      library_id
    } = req.body;

    const query = `
      UPDATE admin_account 
      SET username = ?, full_name = ?, phone_number = ?, address = ?, barangay_id = ?, city = ?, zip_code = ?, account_type = ?, school_id = ?, office_name = ?, email = ?, password = ?, verification_code = ?, verify_status = ?, library_id = ? 
      WHERE id = ?`;

    const [results] = await db.query(query, [
      username,
      full_name,
      phone_number,
      address,
      barangay_id,
      city,
      zip_code,
      account_type,
      school_id,
      office_name,
      email,
      password,
      verification_code,
      verify_status,
      library_id,
      id
    ]);

    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Admin account not found' });
    }

    res
      .status(200)
      .json({ success: true, message: 'Admin account updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete an admin account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await db.query('DELETE FROM admin_account WHERE id = ?', [
      id
    ]);

    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Admin account not found' });
    }

    res
      .status(200)
      .json({ success: true, message: 'Admin account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
