import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Editor from '@monaco-editor/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import PropTypes from 'prop-types';
import React from 'react';
import OutputWindow from './OutputWindow';

// -------------------------------- Custom Tab Panel --------------------------------

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>{children}</Box>
            )}
        </div>
    );
}

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

// -------------------------------- Code Editor --------------------------------

export default function CodeEditor({ user, openSnackbar, codeValues, setCodeValues, result, setResult, handleReset }) {

    // -------------------------------- Controlled inputs --------------------------------

    const handleChange = (event) => {
        const { name, value } = event.target;
        setCodeValues({ ...codeValues, [name]: value });
    };
    const handleEditorChange = (newValue) => {
        setCodeValues({ ...codeValues, source_code: newValue });
    };
    const handleInputChange = (newValue) => {
        setCodeValues({ ...codeValues, stdin: newValue });
    };

    // -------------------------------- Tabs --------------------------------

    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // -------------------------------- Handle requests --------------------------------

    function handleRunClick() {
        const newResult = {
            stdout: '',
            stderr: '',
            compile_output: '',
            time: '',
            memory: '',
            status: 'Processing'
        };
        setResult(newResult);

        axios.post(`${process.env.REACT_APP_BACKEND_URL}/code/execute`, codeValues)
            .then(({ data }) => setResult(data))
            .catch(({ response }) => {
                const { status, compile_output = '' } = response.data;
                setResult({ ...newResult, status: status, compile_output: compile_output })
            });
    };

    function handleSaveClick() {
        const newCode = {
            name: codeValues.name,
            user: user,
            source_code: codeValues.source_code,
            language_id: codeValues.language_id,
            stdin: codeValues.stdin,
            stdout: result.stdout,
            stderr: result.stderr,
            compile_output: result.compile_output,
            time: result.time,
            memory: result.memory,
            status: result.status,
        }
        const method = codeValues.id ? 'put' : 'post';
        const url = `${process.env.REACT_APP_BACKEND_URL}/code${codeValues.id ? `/${codeValues.id}` : ''}`;

        axios[method](url, newCode, { withCredentials: true })
            .then(({ data }) => {
                openSnackbar(`Code ${codeValues.id ? 'updated' : 'saved'} successfully`, 'success');
                const { _id } = data;
                setCodeValues({ ...codeValues, id: _id });
            })
            .catch(({ response }) => {
                openSnackbar(`Could not ${codeValues.id ? 'update' : 'save'} code`, 'error');
                console.log(response);
            });
    }

    // ----------------------------------------------------------------

    return (
        <Grid container>
            <Grid item xs={6}>
                <Select value={codeValues.language_id} name='language_id' onChange={handleChange}>
                    <MenuItem value={1}>C++</MenuItem>
                    <MenuItem value={2}>Java</MenuItem>
                    <MenuItem value={3}>Python</MenuItem>
                </Select>
                <Button onClick={handleRunClick}>Run</Button>
                {user &&
                    <>
                        <TextField
                            label="Name"
                            name='name'
                            value={codeValues.name}
                            onChange={handleChange}
                            variant="outlined"
                        />
                        <Button onClick={handleSaveClick}>Save</Button>
                    </>}
                <Button onClick={handleReset}>Reset</Button>
            </Grid>
            <Grid item xs={6}>
                <Box display='flex'>
                    <Typography sx={{ flex: '1 1 0' }} variant="subtitle2">Status: {result.status}</Typography>
                    <Typography sx={{ flex: '1 1 0' }} variant="subtitle2">Time: {result.time}</Typography>
                    <Typography sx={{ flex: '1 1 0' }} variant="subtitle2">Memory: {result.memory}</Typography>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{ width: '100%' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
                            <Tab label="Code" {...a11yProps(0)} />
                            <Tab label="Input" {...a11yProps(1)} />
                        </Tabs>
                    </Box>
                    <CustomTabPanel value={tabValue} index={0}>
                        <Editor
                            height='30rem'
                            language={codeValues.language_id}
                            value={codeValues.source_code}
                            theme='vs-dark'
                            onChange={handleEditorChange}
                        />
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={1}>
                        <Editor
                            height='30rem'
                            value={codeValues.stdin}
                            theme='vs-dark'
                            onChange={handleInputChange}
                        />
                    </CustomTabPanel>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <OutputWindow
                    output={result.stdout + '\n' + result.stderr + '\n' + result.compile_output}
                    status={result.status}
                />
            </Grid>
        </Grid>
    );
};