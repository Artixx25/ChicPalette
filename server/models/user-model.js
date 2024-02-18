import { Schema, model } from 'mongoose'

const UserSchema = new Schema({
    fullname: {type: String},
    username: {type: String, unique: true, required: 'Please enter your username'},
    email: {type: String, unique: true, required: 'Please enter your email'},
    password: {type: String, required: 'Please enter your password'},

    roles: [{type: String, ref: 'Role'}],

    avatar: String,
    coverImage: String,
    description: String,
    contact: String,

    works: Map,
    likes: {type: Map, of: Boolean},

    isVerificated: {type: Boolean, default: false},
    activationLink: String
}, { timestamps: true })

const UserModel = model('User', UserSchema)

export default UserModel;