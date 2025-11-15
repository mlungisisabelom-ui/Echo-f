import mongoose, { Document, Schema } from 'mongoose';

export interface IGeneration extends Document {
  user: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  prompt: string;
  stack: string;
  output: 'preview' | 'deploy' | 'download';
  generatedFiles: {
    filename: string;
    content: string;
    language: string;
  }[];
  deploymentUrl?: string;
  downloadUrl?: string;
  previewUrl?: string;
  gitCommitHash?: string;
  installationScript?: string;
  documentation?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  metadata: {
    tokensUsed?: number;
    generationTime?: number;
    modelUsed?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GenerationSchema: Schema<IGeneration> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  prompt: {
    type: String,
    required: [true, 'Please provide a generation prompt'],
    maxlength: [2000, 'Prompt can not be more than 2000 characters']
  },
  stack: {
    type: String,
    required: [true, 'Please specify the technology stack'],
    enum: ['react', 'vue', 'angular', 'node', 'python', 'html-css-js', 'react-native', 'electron', 'node-react-fullstack']
  },
  output: {
    type: String,
    enum: ['preview', 'deploy', 'download'],
    default: 'preview'
  },
  generatedFiles: [{
    filename: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    }
  }],
  deploymentUrl: String,
  downloadUrl: String,
  previewUrl: String,
  gitCommitHash: String,
  installationScript: String,
  documentation: String,
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  error: String,
  metadata: {
    tokensUsed: Number,
    generationTime: Number,
    modelUsed: String
  }
}, {
  timestamps: true
});

export default mongoose.model<IGeneration>('Generation', GenerationSchema);
