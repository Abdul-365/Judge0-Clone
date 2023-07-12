import { spawn } from 'child_process';
import fs from 'fs';
import stream from 'stream';
import Code from '../models/codeModel';

export const executeCode = (req, res) => {

    const { code, language, input } = req.body;
    let fileName;

    if (language === 'Python') {
        fileName = 'code.py';
    } else {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // write code to a temporary file
    fs.writeFileSync(fileName, code);

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

    run.on('close', (code) => {
        res.json({ output });
    });
};

export const saveCode = async (req, res) => {
    try {
        let newCode = new Code(req.body);
        await newCode.save();
        res.status(200).send({ message: 'Code saved successfully' });
    } catch (err) {
        res.status(500).send(err);
    }
}
