import { spawn } from 'child_process';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import stream from 'stream';
import Code from '../models/codeModel';
import languages from './languages.json';

// -------------------------------- Execute code in sandbox environment --------------------------------

export const executeCode = (req, res) => {
    const { code, language_id, stdin = '', expected_output = '', time_limit, memory_limit } = req.body;
    const language = languages.find(lang => lang.id === language_id);

    if (!language) {
        return res.status(400).json({ error: 'Unsupported language', status: 'error' });
    }

    // write code to a temporary file
    try {
        fs.writeFileSync(language.fileName, code);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to write code to file', status: 'error' });
    }

    // create a readable stream for user input
    const inputStream = new stream.Readable();
    inputStream.push(stdin);
    inputStream.push(null);

    // run code in a Docker container
    let runCommand = language.runCommand.replace('{fileName}', language.fileName);
    if (time_limit) {
        runCommand = `timeout ${time_limit} ${runCommand}`;
    }
    const run = spawn('docker', ['run', '-i', '--rm', '-v', `${process.cwd()}:/app`, '-w', '/app', language.dockerImage, 'sh', '-c', `time -v ${runCommand}`]);

    // pass user input to container
    inputStream.pipe(run.stdin);

    // read output from child process
    let stdout = '';
    let stderr = '';
    let time = '';
    let memory = '';
    let status = '';
    run.stdout.on('data', (data) => {
        const dataStr = data.toString();
        stdout += dataStr;
    });    

    // handle runtime errors
    run.stderr.on('data', (data) => {
        const dataStr = data.toString();
        if (dataStr.includes('Elapsed (wall clock) time')) {
            time = dataStr.match(/Elapsed \(wall clock\) time.*: (.*)/)[1];
        }
        if (dataStr.includes('Maximum resident set size')) {
            memory = dataStr.match(/Maximum resident set size.*: (.*)/)[1];
            if (memory_limit && parseInt(memory) > memory_limit) {
                status = 'Memory limit exceeded';
            }
        }
        if (!dataStr.includes('\tCommand being timed')) {
            stderr += dataStr;
        }
        if (stderr.includes('Command not found')) {
            status = 'Compilation error';
        }
    });       

    run.on('error', (err) => {
        res.status(500).json({ error: 'Failed to execute code', status: 'Internal error' });
    });

    run.on('close', (code) => {
        if (!status) {
            if (code === 124)
                status = 'Time limit exceeded';
            else if (code !== 0) {
                status = 'Runtime error';
            } else if (!expected_output || stdout.trim() === expected_output.trim()) {
                status = 'Accepted';
            } else {
                status = 'Wrong answer';
            }
        }
        res.json({ stdout, stderr, time, memory, status });
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