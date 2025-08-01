const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['job_seeker', 'company'], required: true },
    profile: {
      skills: [String], 
      resume: [{
        url: String,       
        uploadedAt: Date
      }],
      personalInfo: {
        phone: String,
        address: String,
        dateOfBirth: Date
      }
    },
  },{timestamps:true});
  
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); 
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
