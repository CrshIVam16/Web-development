const mongoose = require('mongoose');
const url =  'mongodb://127.0.0.1:27017/offcampus';

// Asynchronus Function
mongoose.connect(url)
.then((result) => {
    console.log('connect to DB');
})

.catch((err) => {
    console.log(err);
});

module.exports = mongoose;