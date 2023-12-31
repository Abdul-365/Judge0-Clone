import MuiAlert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import axios from 'axios';
import { forwardRef, useEffect, useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import CodeEditor from './components/CodeEditor';
import NavDrawer from './components/NavDrawer';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Submissions from './components/Submissions';

const Alert = forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function App() {

    // -------------------------------- User --------------------------------

    const [user, setUser] = useState(null);
    const [updateTrigger, setTrigger] = useState(false);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/user`, { withCredentials: true })
            .then((response) => {
                if (response) setUser(response.data)
                else setUser(null);
            })
            .catch((err) => console.log(err));
    }, [updateTrigger]);

    // -------------------------------- Snackbar --------------------------------

    const [snackbar, setSnackbar] = useState({
        content: '',
        severity: '',
        open: false,
        vertical: 'bottom',
        horizontal: 'right',
    });
    const { vertical, horizontal, open, content, severity } = snackbar;

    const openSnackbar = (content, severity) => {
        setSnackbar({ ...snackbar, open: true, content: content, severity: severity });
    };

    const closeSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // -------------------------------- Code Editor ------------------------------

    const [codeValues, setCodeValues] = useState({
        id: '',
        name: '',
        source_code: '',
        language_id: 1,
        stdin: '',
    });

    const [result, setResult] = useState({
        stdout: '',
        stderr: '',
        compile_output: '',
        time: '',
        memory: '',
        status: ''
    });

    function handleReset() {
        setCodeValues({
            id: '',
            name: '',
            source_code: '',
            language_id: 1,
            stdin: '',
        });
        setResult({
            stdout: '',
            stderr: '',
            compile_output: '',
            time: '',
            memory: '',
            status: '',
        });
    }

    // ----------------------------------------------------------------

    return (
        <>
            <Routes>
                <Route path='/' element={
                    <>
                        <NavDrawer
                            user={user}
                            openSnackbar={openSnackbar}
                            setTrigger={setTrigger}
                            setCodeValues={setCodeValues}
                            setResult={setResult}
                            handleReset={handleReset}
                        />
                        <Container maxWidth="xl" sx={{ mt: 6, mb: 2 }}>
                            <Outlet />
                        </Container>
                    </>
                }>
                    <Route path='' element={<CodeEditor
                        user={user}
                        openSnackbar={openSnackbar}
                        codeValues={codeValues}
                        setCodeValues={setCodeValues}
                        result={result}
                        setResult={setResult}
                        handleReset={handleReset}
                    />} />
                    <Route path='signin' element={<SignIn
                        setTrigger={setTrigger}
                        openSnackbar={openSnackbar}
                    />} />
                    <Route path='submissions' element={<Submissions
                        setCodeValues={setCodeValues}
                        setResult={setResult}
                        openSnackbar={openSnackbar}
                    />} />
                </Route>
                <Route path='/signup' element={
                    <SignUp setTrigger={setTrigger} openSnackbar={openSnackbar} />}
                />
            </Routes>
            <Snackbar
                anchorOrigin={{
                    vertical,
                    horizontal
                }}
                open={open}
                autoHideDuration={3000}
                onClose={closeSnackbar}>
                <Alert onClose={closeSnackbar} severity={severity} sx={{ width: '100%' }}>
                    {content}
                </Alert>
            </Snackbar>
        </>
    );
}