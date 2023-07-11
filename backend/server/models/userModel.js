import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, validate: validator.isEmail },
    password: { type: String, required: true, minLength: 6 },
}, { timestamps: true });

userSchema.set('toJSON', { getters: true });

userSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password')) return next();
    try {
        const hash = await bcrypt.hash(user.password, 12);
        user.password = hash;
        return next();
    } catch (err) {
        return res.status(500).send(err);
    }
});

userSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (!update.password) return next();
    try {
        const hash = await bcrypt.hash(update.password, 12);
        update.password = hash;
        return next();
    } catch (err) {
        return res.status(500).send(err);
    }
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);