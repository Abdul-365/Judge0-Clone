import { body, validationResult } from 'express-validator';
import passport from 'passport';
import User from '../models/userModel';

// -------------------------------- User Authentication --------------------------------

export const login = (req, res, next) => {
    passport.authenticate('local', function (err, user, info) {
        if (err)
            return res.status(500).send(err);
        if (!user)
            return res.status(401).send(info);
        req.logIn(user, function (err) {
            if (err)
                return res.status(500).send(err);
            return res.status(200).send(user);
        });
    })(req, res, next);
}

export const logout = (req, res) => {
    req.logout(function (err) {
        if (err) return res.status(500).send(err);
        res.status(200).json({ message: 'User logged out' });
    });
}

export const isAuth = (req, res, next) => {
    if (req.user) return next();
    res.status(401).json({ message: 'User not logged in' });
};

// -------------------------------- Manage Users --------------------------------

export const validateCreateUser = [
    body('name', 'Name must be specified.').trim().isLength({ min: 1 }).escape(),
    body('email', 'Email must be valid').trim().isEmail().escape(),
    body('password', 'Password must be at least 6 characters long').trim().isLength({ min: 6 }).escape()
]

export const validateUpdateUser = [
    body('name', 'Name must be specified.').optional().trim().isLength({ min: 1 }).escape(),
    body('email', 'Email must be valid').optional().trim().isEmail().escape(),
    body('password', 'Password must be at least 6 characters long').optional().trim().isLength({ min: 6 }).escape()
]

export const checkUser = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    next();
}

export const createUser = async (req, res) => {
    try {
        let newUser = new User(req.body)
        await newUser.save();
        login(req, res);
    } catch (err) {
        res.status(500).send(err);
    }
}

export const readUser = (req, res) => {
    if (!req.user) return res.send();
    res.status(200).json(req.user);
}

export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json(user);
    } catch (err) {
        res.status(500).send(err);
    }
};

export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndRemove(req.user._id);
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).send(err);
    }
}