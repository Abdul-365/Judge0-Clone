import { exec, spawn } from 'child_process';
import { body, validationResult } from 'express-validator';
import stream from 'stream';
import { promisify } from 'util';
import Code from '../models/codeModel';
import languages from './languages.json';
const execAsync = promisify(exec);

// -------------------------------- Check Validation --------------------------------

export const checkValidation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ error: errors.array() });
    next();
}

// -------------------------------- Execute code in sandbox environment --------------------------------

export const validateExecuteCode =
    body('language_id', 'Language ID must be specified').isLength({ min: 1 });

export const executeCode = async (req, res) => {

    const { source_code, language_id, stdin = '', expected_output = '', time_limit = '5s', memory_limit } = req.body;
    const language = languages.find(lang => lang.id === language_id);

    if (!language)
        return res.status(400).json({ message: 'Unsupported Language', status: 'Error' });

    // write code to a temporary file
    try {
        const { stdout } = await execAsync(`docker inspect -f '{{.State.Running}}' my-container`);
        // start container if not running
        if (stdout.trim() !== 'true')
            await execAsync(`docker start my-container`);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to start container', status: 'Error', error });
    }

    let compile_output = '';
    // create a readable stream for source code
    const sourceStream = new stream.Readable();
    sourceStream.push(source_code);
    sourceStream.push(null);

    // write source code to file in container
    const write = spawn('docker', ['exec', '-i', 'my-container', 'sh', '-c', `cat - > /app/${language.fileName}`]);
    sourceStream.pipe(write.stdin);
    write.on('error', (error) => {
        return res.status(500).json({ message: 'Failed to write code to file', status: 'Error', error });
    });
    write.on('close', () => {
        // compile code if necessary
        if (language.compileCommand) {
            const compile = spawn('docker', ['exec', '-i', 'my-container', 'sh', '-c', language.compileCommand]);
            compile.stderr.on('data', (data) => {
                compile_output += data.toString();
            });
            compile.on('close', (code) => {
                if (code !== 0)
                    return res.status(400).json({ status: 'Compilation Error', compile_output });
                runCode();
            });
        } else {
            runCode();
        }
    });

    function runCode() {
        // create a readable stream for user input
        const inputStream = new stream.Readable();
        inputStream.push(stdin);
        inputStream.push(null);

        // run code in a Docker container
        let runCommand = language.runCommand.replace('{fileName}', language.fileName);
        if (time_limit)
            runCommand = `timeout ${time_limit} ${runCommand}`;
        const timeOutputFile = '/tmp/time-output.txt';
        const run = spawn('docker', ['exec', '-i', 'my-container', 'sh', '-c', `time -v -o ${timeOutputFile} ${runCommand}`]);

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

        run.on('error', (error) => {
            res.status(500).json({ message: 'Failed to execute code', status: 'Internal Error', error });
        });

        run.on('close', async (code) => {
            try {
                const { stdout: timeStdout } = await execAsync(`docker exec my-container cat ${timeOutputFile}`);
                const timeOutput = timeStdout;
                if (timeOutput) {
                    const timeMatch = timeOutput.match(/Elapsed \(wall clock\) time.*: (.*)/);
                    if (timeMatch)
                        time = timeMatch[1];
                    const memoryMatch = timeOutput.match(/Maximum resident set size.*: (.*)/);
                    if (memoryMatch)
                        memory = memoryMatch[1];
                }
            } catch (error) {
                return res.status(500).json({ message: 'Failed to read time output file', status: 'Internal Error', error });
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
            res.status(200).json({ stdout, stderr, compile_output, time, memory, status });

            // cleanup step
            try {
                await execAsync(`docker exec my-container sh -c "rm /app/*"`);
            } catch (error) {
                console.error('Failed to delete files in container', error);
            }            
        });
    }
};

// -------------------------------- Manage Code Submissions --------------------------------

export const validateCreateCode = [
    body('name', 'Name must be specified.').trim().isLength({ min: 1 }).escape(),
    body('language_id', 'Language ID must be specified').trim().isLength({ min: 1 }).escape(),
]
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

export const validateUpdateCode = [
    body('name', 'Name must be specified.').optional().trim().isLength({ min: 1 }).escape(),
    body('language_id', 'Language ID must be specified').optional().trim().isLength({ min: 1 }).escape(),
]
export const updateCode = async (req, res) => {
    try {
        await Code.findByIdAndUpdate(
            req.params.codeId,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json({ message: 'Code updated successfully' });
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