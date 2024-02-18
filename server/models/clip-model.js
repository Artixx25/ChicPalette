import mongoose from 'mongoose';

const ClipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },
  subDescription: { type: String },
  category: { type: String },
  likes: { type: Map, of: Boolean },
  comments: [
    {
        userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
        userAvatar: { type: String },
        username: { type: String },
        userRoles: [{type: String, ref: 'Role'}],
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }
],
  video: { type: String },
}, { timestamps: true });

const ClipModel = mongoose.model('Clip', ClipSchema);
export default ClipModel;