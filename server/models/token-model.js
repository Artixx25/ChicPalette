import { Schema, model } from 'mongoose'

const TokenSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    refreshToken: {type: String, required: true},
})
const tokenModel = model('Token', TokenSchema);
export default tokenModel