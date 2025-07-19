const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const env=require("dotenv")
env.config();
const app = express()
app.use(cors())
app.use(bodyParser.json())

// Connect to MongoDB (replace <connection_string> with your own)
mongoose.connect(`${process.env.DATABASE_URL}/hackathon`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err))

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
})

const User = mongoose.model('User', userSchema)

// Register API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body
  // Check if user exists
  const existingUser = await User.findOne({ email })
  if (existingUser) return res.status(400).json({ message: 'User already exists' })

  const user = new User({ username, email, password }) // Note: In production, hash password!
  await user.save()
  res.json({ message: 'User registered successfully' })
})

// Login API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email, password })
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  // For demo just return user data (In production use JWT etc.)
  res.json({ user: { username: user.username, email: user.email } })
})

// API to get profile data (for demo, email is sent as query param)
app.get('/api/profile', async (req, res) => {
  const email = req.query.email
  if (!email) return res.status(400).json({ message: 'Email required' })

  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'User not found' })

  res.json({ username: user.username, email: user.email })
})
app.get("/data",async(req,res)=>{
     const data=await User.find({});
     res.json(data);
})

const PORT = 3000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))
