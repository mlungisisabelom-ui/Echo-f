import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  stack: string;
  isPublic: boolean;
  tags: string[];
  githubUrl?: string;
  deploymentUrl?: string;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema<IProject> = new Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true,
    maxlength: [100, 'Name can not be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  stack: {
    type: String,
    required: [true, 'Please specify the technology stack'],
    enum: ['react', 'vue', 'angular', 'node', 'python', 'html-css-js', 'react-native', 'electron']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  githubUrl: {
    type: String,
    match: [
      /https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+/,
      'Please provide a valid GitHub URL'
    ]
  },
  deploymentUrl: {
    type: String
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified on save
ProjectSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

export default mongoose.model<IProject>('Project', ProjectSchema);
