import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Editor from '@monaco-editor/react';
import OutputWindow from './OutputWindow';
import axios from 'axios';

export default function Home() {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('Python');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');

    const handleEditorChange = (newValue) => {
        setCode(newValue);
    };

    const handleLanguageChange = (event) => {
        setLanguage(event.target.value);
    };

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const handleRunClick = () => {

        const data = {
            code: code,
            language: language,
            input: input
        }

        axios.post('http://localhost:4000/code/execute', data)
            .then(res => {
                setOutput(res.data.output);
            })
            .catch(err => console.log(err));
    };

    return (
        <Grid container>
            <Grid item xs={12}>
                <Select value={language} onChange={handleLanguageChange}>
                    <MenuItem value="Python">Python</MenuItem>
                    <MenuItem value="javascript">JavaScript</MenuItem>
                </Select>
                <Button onClick={handleRunClick}>Run</Button>
            </Grid>
            <Grid item xs={8}>
                <Editor
                    height='600px'
                    language={language}
                    value={code}
                    theme='vs-dark'
                    onChange={handleEditorChange}
                />
            </Grid>
            <Grid item xs={4}>
                <Editor
                    height='300px'
                    language={language}
                    value={input}
                    theme='vs-dark'
                    onChange={handleInputChange}
                />
                <OutputWindow output={output} />
            </Grid>
        </Grid>
    );
};