import { spawn } from 'child_process';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import stream from 'stream';
import Code from '../models/codeModel';

// -------------------------------- Execute code in sandbox environment --------------------------------

export const executeCode = (req, res) => {
    const { code, language, input } = req.body;
    let fileName;

    if (language === 'Python') {
        fileName = 'code.py';
    } else {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // write code to a temporary file
    try {
        fs.writeFileSync(fileName, code);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to write code to file' });
    }

    // create a readable stream for user input
    const inputStream = new stream.Readable();
    inputStream.push(input);
    inputStream.push(null);

    // run code in a Docker container
    const run = spawn('docker', ['run', '-i', '--rm', '-v', `${process.cwd()}:/app`, '-w', '/app', 'python:3.9', 'python', fileName]);

    // pass user input to container
    inputStream.pipe(run.stdin);

    // read output from child process
    let output = '';
    run.stdout.on('data', (data) => {
        output += data.toString();
    });

    // handle runtime errors
    run.stderr.on('data', (data) => {
        if (!data.toString().includes('Unable to find image')) {
            output += data.toString();
        }
    });

    run.on('error', (err) => {
        res.status(500).json({ error: 'Failed to execute code' });
    });

    run.on('close', (code) => {
        res.json({ output });
    });
};

// -------------------------------- Manage Code Submissions --------------------------------

export const validateCreateCode = [
    body('title', 'Title must be specified.').trim().isLength({ min: 1 }).escape(),
    body('language', 'Language must be specified').trim().isLength({ min: 1 }).escape(),
    body('code', 'Editor must contain code').isLength({ min: 1 })
]

export const validateUpdateCode = [
    body('title', 'Title must be specified.').optional().trim().isLength({ min: 1 }).escape(),
    body('language', 'Language must be specified').optional().trim().isLength({ min: 1 }).escape(),
    body('code', 'Editor must contain code').optional().isLength({ min: 1 })
]

export const checkCode = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    next();
}

export const createCode = async (req, res) => {
    try {
        req.body.user = req.user._id;
        let newCode = new Code(req.body);
        await newCode.save();
        res.status(200).send({ message: 'Code saved successfully' });
    } catch (err) {
        res.status(500).send(err);
    }
}

export const readCode = async (req, res) => {
    try {
        const code = await Code.findById(req.params.codeId);
        res.status(200).json(code);
    } catch (err) {
        res.status(500).send(err);
    }
}

export const updateCode = async (req, res) => {
    try {
        const user = await Code.findByIdAndUpdate(
            req.params.codeId,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json(user);
    } catch (err) {
        res.status(500).send(err);
    }
};

export const deleteCode = async (req, res) => {
    try {
        await Code.findByIdAndRemove(req.params.codeId);
        res.status(200).send({ message: 'Code deleted successfully' });
    } catch (err) {
        res.status(500).send(err);
    }
}