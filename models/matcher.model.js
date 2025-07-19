const mongoose = require('mongoose');
const { Schema } = mongoose;

const ApplicationSchema = new Schema({
  candidate: {
    type: Schema.Types.ObjectId,
    ref: 'User', // References Candidate (User._id)
    required: true
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job', // References Job (Job._id)
    required: true
  },
  matchScore: {
    type: Number, // Calculated matching score/percent
    required: true
  },
  feedback: {
    type: String, // Optional recruiter feedback
    required: false
  }
}, {
  timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' }
  // Automatically manages application and status update timestamps
});

module.exports = mongoose.model('Application', ApplicationSchema);
