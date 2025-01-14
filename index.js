const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require
('body-parser')
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true}
})

const ExerciseSchema = new Schema({
  uid: { type: String, required: true},
  desc: { type: String, required: true},
  dur: { type: Number, required: true},
  date: { type: String, required: true}
})

const User = mongoose.model('User', UserSchema);
const Exercise = mongoose.model('Exercise', ExerciseSchema);

const saveUsername = (username, done) => {
  const newUser = new User({"username": username})
  newUser.save((err, data) => {
    if (err) return console.error(err)
    return done(null, data)
  })
}

const findAndRetrieveUser = (id, done) => {
  User.findById(id, (err, data) => {
    if (err) return console.error(err)
    return done(null, data)
  })
}

const getAllUsers = (done) => {
  User.find((err, data) => {
    if (err) return console.error(err)
    return done(null, data)
  })
}

const saveExercise = (input, done) => {
  console.log(input)
  const newExercise = new Exercise({
    "uid": input._id,
    "desc": input.description,
    "dur": input.duration,
    "date": input.date
  })
  newExercise.save((err, data) => {
    if (err) return console.error(err)
    return done(null, data)
  })
}

const retrieveUserExercises = (id, done) => {
  Exercise.find({uid:id}, (err, data) => {
    if (err) return console.error(err)
    return done(null, data)
  })
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.route('/api/users')
.post((req, res) => {
  const {username} = req.body
  saveUsername(username, (err, data) => {
    if(err) return res.json({error: err})
    return res.json({
      username: data.username,
      _id: data._id
    })
  })
})
.get((req, res) => {
  getAllUsers((err, data) => {
    return res.json(data)
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const {description, duration, date} = req.body
  const {_id} = req.params;
  const dateString = date? new Date(date).toDateString() : new Date().toDateString()
  findAndRetrieveUser(_id, (err, userData) => {

    const newExercise = {
      _id,
      description,
      duration,
      date: dateString
    };

    saveExercise(newExercise, (err, exData) => {
      if(err) return res.json({error: err})
      return res.json({
        username: userData.username,
        description: exData.desc,
        duration: exData.dur,
        date: exData.date,
        _id: exData.uid
      })
    })
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  findAndRetrieveUser(_id, (err, userData) => {
    if (err) return res.json({ error: err });

    retrieveUserExercises(userData._id, (err, exerciseData) => {
      if (err) return res.json({ error: err });

      let filteredExercises = exerciseData;
      if (from) {
        const fromDate = new Date(from);
        filteredExercises = filteredExercises.filter(ex => new Date(ex.date) >= fromDate);
      }
      if (to) {
        const toDate = new Date(to);
        filteredExercises = filteredExercises.filter(ex => new Date(ex.date) <= toDate);
      }

      // Limit the number of exercises if 'limit' is provided
      if (limit) {
        filteredExercises = filteredExercises.slice(0, parseInt(limit));
      }

      // Format the log entries
      let log = filteredExercises.map(value => ({
        description: value.desc,
        duration: value.dur,
        date: new Date(value.date).toDateString() // Ensure date is properly formatted
      }));

      return res.json({
        username: userData.username,
        count: log.length,
        _id: _id,
        log: log
      });
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
