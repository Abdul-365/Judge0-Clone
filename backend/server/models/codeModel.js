import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const codeSchema = new Schema({

    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source_code: { type: String, required: true },
    language_id: { type: Number, required: true },
    stdin: { type: String },

    // output
    stdout: { type: String },
    stderr: { type: String },
    compile_output: { type: String },

    time: { type: String },
    memory: { type: String },
    status: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Code', codeSchema);