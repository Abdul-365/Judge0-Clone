import { spawn } from 'child_process';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import stream from 'stream';
import Code from '../models/codeModel';
import languages from './languages.json';

// -------------------------------- Execute code in sandbox environment --------------------------------

export const executeCode = (req, res) => {
    const { source_code, language_id, stdin = '', expected_output = '', time_limit, memory_limit } = req.body;
    const language = languages.find(lang => lang.id === language_id);

    if (!language)
        return res.status(400).json({ error: 'Unsupported Language', status: 'Error' });

    // write code to a temporary file
    try {
        fs.writeFileSync(language.fileName, source_code);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to write code to file', status: 'Error' });
    }

    // compile code if necessary
    let compile, compile_output = '';
    if (language.compileCommand) {
        compile = spawn('docker', ['run', '-i', '--rm', '-v', `${process.cwd()}:/app`, '-w', '/app', 'code-executor', 'sh', '-c', language.compileCommand]);
        compile.stderr.on('data', (data) => {
            compile_output += data.toString();
        });
        compile.on('close', (code) => {
            if (code !== 0)
                return res.json({ status: 'Compilation Error', compile_output });
            runCode();
        });
    } else {
        runCode();
    }

    function runCode() {
        // create a readable stream for user input
        const inputStream = new stream.Readable();
        inputStream.push(stdin);
        inputStream.push(null);

        // run code in a Docker container
        let runCommand = language.runCommand.replace('{fileName}', language.fileName);
        if (time_limit)
            runCommand = `timeout ${time_limit} ${runCommand}`;
        const timeOutputFile = path.join('./time-output.txt');
        const run = spawn('docker', ['run', '-i', '--rm', '-v', `${process.cwd()}:/app`, '-w', '/app', 'code-executor', 'sh', '-c', `time -v -o ${timeOutputFile} ${runCommand}`]);

        // pass user input to container
        inputStream.pipe(run.stdin);

        let stdout = '';
        let stderr = '';
        let time = '';
        let memory = '';
        let status = '';
        
        // read output from child process
        run.stdout.on('data', (data) => {
            const dataStr = data.toString();
            stdout += dataStr;
        });

        // read errors from child process
        run.stderr.on('data', (data) => {
            const dataStr = data.toString();
            stderr += dataStr;
        });

        run.on('error', (err) => {
            res.status(500).json({ error: 'Failed to execute code', status: 'Internal Error' });
        });

        run.on('close', (code) => {
            let timeOutput;
            try {
                timeOutput = fs.readFileSync(timeOutputFile, 'utf8');
            } catch (err) {
                return res.status(500).json({ error: 'Failed to read time output file', status: 'Internal Error' });
            }
            if (timeOutput) {
                const timeMatch = timeOutput.match(/Elapsed \(wall clock\) time.*: (.*)/);
                if (timeMatch) {
                    time = timeMatch[1];
                }
                const memoryMatch = timeOutput.match(/Maximum resident set size.*: (.*)/);
                if (memoryMatch) {
                    memory = memoryMatch[1];
                }
            }
            if (code === 124)
                status = 'Time Limit Exceeded';
            else if (memory_limit && parseInt(memory) > memory_limit)
                status = 'Memory Limit Exceeded';
            else if (code !== 0)
                status = 'Runtime Error';
            else if (!expected_output || stdout.trim() === expected_output.trim())
                status = 'Accepted';
            else
                status = 'Wrong Answer';
            res.json({ stdout, stderr, compile_output, time, memory, status });
        });
    }
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