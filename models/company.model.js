const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  website: { type: String },
  email :{type :String,required:true},
  address: { type: String },
  description: { type: String },
  industry: { type: String },
  size: { type: String },
  logoUrl: { type: String },
  jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }]
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

module.exports = mongoose.model('Company', companySchema);
