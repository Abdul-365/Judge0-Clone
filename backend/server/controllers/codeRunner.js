import { spawn } from 'child_process';
import fs from 'fs';

const codeRunner = (io) => {
    io.on('connection', (socket) => {

        console.log('Client connected to socket.io server');

        let run;

        socket.on('compile', (data) => {
            const code = data.code;
            const language = data.language;

            let compiler, fileName, args;
            if (language === 'C++') {
                compiler = 'g++';
                fileName = 'code.cpp';
                args = [fileName];
            } else if (language === 'Java') {
                compiler = 'javac';
                fileName = 'Main.java';
                args = [fileName];
            } else if (language === 'Python') {
                // no need to compile Python code
                fileName = 'code.py';
                fs.writeFileSync(fileName, code);
                return;
            } else {
                return socket.emit('compileError', { error: 'Unsupported language' });
            }

            // write code to a temporary file
            fs.writeFileSync(fileName, code);

            // compile code
            const compile = spawn(compiler, args);

            // handle compile errors
            let error = '';
            compile.stderr.on('data', (data) => {
                error += data.toString();
            });

            compile.on('close', (code) => {
                if (code !== 0) {
                    return socket.emit('compileError', { error });
                }

                // run compiled code
                let runCommand, runArgs;
                if (language === 'C++') {
                    runCommand = 'a.exe';
                    runArgs = [];
                } else if (language === 'Java') {
                    runCommand = 'java';
                    runArgs = ['Main'];
                } else if (language === 'Python') {
                    runCommand = 'python';
                    runArgs = [fileName];
                }

                run = spawn(runCommand, runArgs);

                // read output from child process
                run.stdout.on('data', (data) => {
                    socket.emit('output', data.toString());
                });

                run.on('close', (code) => {
                    socket.emit('done');
                });
            });
        });

        socket.on('input', (input) => {
            if (run && run.stdin.writable) {
                run.stdin.write(input);
            }
        });

        socket.on('disconnect', () => {
            if (run) {
                run.kill();
            }
        });
    });
};

export default codeRunner;
