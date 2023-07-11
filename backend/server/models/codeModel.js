import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const codeSchema = new Schema({
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Code', codeSchema);