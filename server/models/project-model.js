import mongoose, { Schema, model } from 'mongoose'

const WorkSchema = new Schema({
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
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
    additionalImages: { type: Array, of: String },
    previewImage: { type: String }
},
    { timestamps: true })

WorkSchema.pre('save', function (next) {
    this.comments.forEach(comment => {
        comment.updatedAt = Date.now();
    });
    next();
});

const PostModel = model('Work', WorkSchema);
export default PostModel