import { exec, spawn } from 'child_process';
import { body, validationResult } from 'express-validator';
import stream from 'stream';
import { promisify } from 'util';
import Code from '../models/codeModel';
import languages from '../../languages.json';
const execAsync = promisify(exec);

// -------------------------------- Check Validation --------------------------------

export const checkValidation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ error: errors.array() });
    next();
}

export const validateExecuteCode =
    body('language_id', 'Language ID must be specified').isLength({ min: 1 });

// -------------------------------- Execute code in sandbox environment --------------------------------

const POOL_SIZE = 20;
const containerPool = [];
const containerAvailableCallbacks = [];

export async function createContainerPool() {
    // get the list of existing containers
    const { stdout } = await execAsync('docker ps -a --filter "name=my-container" --format "{{.Names}}"');
    const existingContainers = stdout.split('\n').filter(name => name);

    // add existing containers to the pool
    containerPool.push(...existingContainers);

    // create new containers if necessary
    const numContainersToCreate = POOL_SIZE - existingContainers.length;
    for (let i = 0; i < numContainersToCreate; i++) {
        const containerName = `my-container-${Date.now()}-${i}`;
        try {
            await execAsync(`docker run --name ${containerName} -d code-executor`);
            containerPool.push(containerName);
        } catch (error) {
            console.error('Failed to create container', error);
        }
    }
}

export const executeCode = async (req, res) => {

    const { source_code, language_id, stdin = '', expected_output = '', time_limit = '5s', memory_limit } = req.body;
    const language = languages.find(lang => lang.id === language_id);

    if (!language)
        return res.status(400).json({ message: 'Unsupported Language', status: 'Error' });

    // create a new container or wait for one to become available
    let containerName;
    if (containerPool.length > 0) {
        containerName = containerPool.pop();
    } else {
        containerName = await new Promise(resolve => {
            containerAvailableCallbacks.push(resolve);
        });
    }

    let compile_output = '';
    // create a readable stream for source code
    const sourceStream = new stream.Readable();
    sourceStream.push(source_code);
    sourceStream.push(null);

    // write source code to file in container
    const write = spawn('docker', ['exec', '-i', containerName, 'sh', '-c', `cat - > /app/${language.fileName}`]);
    sourceStream.pipe(write.stdin);
    write.on('error', (error) => {
        cleanup();
        res.status(500).json({ message: 'Failed to write code to file', status: 'Error', error });
    });
    write.on('close', () => {
        // compile code if necessary
        if (language.compileCommand) {
            const compile = spawn('docker', ['exec', '-i', containerName, 'sh', '-c', language.compileCommand]);
            compile.stderr.on('data', (data) => {
                compile_output += data.toString();
            });
            compile.on('close', (code) => {
                if (code !== 0) {
                    cleanup();
                    return res.status(400).json({ status: 'Compilation Error', compile_output });
                }
                runCode();
            });
        } else {
            runCode();
        }
    });

    async function runCode() {
        // create a readable stream for user input
        const inputStream = new stream.Readable();
        inputStream.push(stdin);
        inputStream.push(null);

        // run code in a Docker container
        let runCommand = language.runCommand.replace('{fileName}', language.fileName);
        if (time_limit)
            runCommand = `timeout ${time_limit} ${runCommand}`;
        const timeOutputFile = '/tmp/time-output.txt';
        const run = spawn('docker', ['exec', '-i', containerName, 'sh', '-c', `time -v -o ${timeOutputFile} ${runCommand}`]);

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
            cleanup();
            res.status(500).json({ message: 'Failed to execute code', status: 'Internal Error', error });
        });

        run.on('close', async (code) => {
            try {
                const { stdout: timeStdout } = await execAsync(`docker exec ${containerName} cat ${timeOutputFile}`);
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
                cleanup();
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
            cleanup();
        });
    }

    async function cleanup() {
        try {
            // delete any files that were created during the request
            await execAsync(`docker exec ${containerName} sh -c "rm -rf /app/*"`);
            // return the container to the pool or assign it to a waiting callback
            const callback = containerAvailableCallbacks.shift();
            if (callback) {
                callback(containerName);
            } else {
                containerPool.push(containerName);
            }
        } catch (error) {
            console.error('Failed to reset container', error);
        }
    }
};

// -------------------------------- Manage Code Submissions --------------------------------

export const validateCreateCode = [
    body('name', 'Name must be specified.').trim().isLength({ min: 1 }).escape(),
    body('language_id', 'Language ID must be specified').trim().isLength({ min: 1 }).escape(),
    body('user', 'User ID must be specified').trim().isLength({ min: 1 }),
    body('time').trim().escape(),
    body('memory').trim().escape(),
    body('status').trim().escape(),
]
export const createCode = async (req, res) => {
    try {
        req.body.user = req.user._id;
        let newCode = new Code(req.body);
        await newCode.save();
        res.status(200).send(newCode);
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

export const readAllCodes = async (req, res) => {
    try {
        const code = await Code.find({ user: req.user._id });
        res.status(200).json(code);
    } catch (err) {
        res.status(500).send(err);
    }
}

export const validateUpdateCode = [
    body('name', 'Name must be specified.').optional().trim().isLength({ min: 1 }).escape(),
    body('language_id', 'Language ID must be specified').optional().trim().isLength({ min: 1 }).escape(),
    body('user', 'User ID must be specified').optional().isLength({ min: 1 }),
    body('time').optional().trim().escape(),
    body('memory').optional().trim().escape(),
    body('status').optional().trim().escape(),
]
export const updateCode = async (req, res) => {
    try {
        const code = await Code.findByIdAndUpdate(
            req.params.codeId,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json(code);
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