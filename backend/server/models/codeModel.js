import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const codeSchema = new Schema({
    title: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    input: { type: String },
    output: { type: String },
    error: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Code', codeSchema);