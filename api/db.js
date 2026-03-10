// handle connection to MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

// conect to MongoDB
const connect = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');
    }
    catch (err) {
        console.log('Could not connect to MongoDB.',err.message);
        process.exit(1);
    }
}

module.exports = connect;