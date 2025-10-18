// backend/src/modules/users/userController.js (LIVE DATABASE INTEGRATION)

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../config/db.js'; // 🛑 USING ACTUAL DB IMPORT 🛑

// Get the secret key from environment variables
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key'; 

// --- Database Helper Functions (Using real SQL) ---

// Helper function to query the database and return a user object
const findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT id, email, password FROM users WHERE email = ?';
        db.query(sql, [email], (err, results) => {
            if (err) return reject(err);
            // If user found, resolve with the user object (first result)
            if (results.length > 0) {
                resolve(results[0]);
            } else {
                // If user not found, resolve with null
                resolve(null);
            }
        });
    });
};

// Helper function to insert a new user into the database
const createUser = (email, hashedPassword) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
        db.query(sql, [email, hashedPassword], (err, result) => {
            if (err) return reject(err);
            // Resolve with the ID of the newly inserted user
            resolve(result.insertId);
        });
    });
};
// --- End Database Helper Functions ---


// [1] User Registration
export const registerUser = async (req, res) => {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Please provide a valid email and a password of at least 6 characters.' });
    }

    try {
        // Check if user already exists
        if (await findUserByEmail(email)) {
            return res.status(400).json({ error: 'User already exists with that email.' });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Insert user into DB
        const userId = await createUser(email, hashedPassword); 

        // Generate a token for immediate login (optional, but convenient)
        const token = jwt.sign({ id: userId, email: email }, SECRET_KEY, {
            expiresIn: '24h', 
        });

        res.status(201).json({ 
            message: 'User registered successfully and logged in.', 
            token,
            userId
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
};

// [2] User Login
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    // Basic input validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    try {
        const user = await findUserByEmail(email);

        // Check if user exists AND if the password matches the hash
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT token containing user ID
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
            expiresIn: '24h', 
        });

        // Send token to the client
        res.status(200).json({ 
            message: 'Login successful', 
            token,
            userId: user.id
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};