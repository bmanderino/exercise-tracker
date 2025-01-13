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

const saveExercise = (input, done) => {
  console.log(input)
  const newExercise = new Exercise({"uid": input._id, "desc": input.description, "dur": input.duration, "date": input.date})
  newExercise.save((err, data) => {
    if (err) return console.error(err)
    return done(null, data)
  })
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', (req, res) => {
  const {username} = req.body
  saveUsername(username, (err, data) => {
    if(err) return res.json({error: err})
    return res.json({
      username: data.username,
      _id: data._id
    })
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const {description, duration, date} = req.body
  const {_id} = req.params;
  const dateString = new Date(date).toDateString()
  findAndRetrieveUser(_id, (err, userData) => {
    saveExercise({_id, description, duration, "date":dateString}, (err, exData) => {
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

app.get('', (req, res) => {
  return res.json({
    username: "fcc_test",
    count: 1,
    _id: "5fb5853f734231456ccb3b05",
    log: [{
      description: "test",
      duration: 60,
      date: "Mon Jan 01 1990",
    }]
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
