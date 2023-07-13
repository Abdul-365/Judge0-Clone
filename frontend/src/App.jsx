// import MuiAlert from '@mui/material/Alert';
import Container from '@mui/material/Container';
// import Snackbar from '@mui/material/Snackbar';
// import axios from 'axios';
// import { forwardRef } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Navbar from './components/Navbar';

// const Alert = forwardRef(function Alert(props, ref) {
//     return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
// });

export default function App() {

    // // -------------------------------- Snackbar --------------------------------

    // const [snackbar, setSnackbar] = useState({
    //     content: '',
    //     severity: '',
    //     open: false,
    //     vertical: 'bottom',
    //     horizontal: 'right',
    // });
    // const { vertical, horizontal, open, content, severity } = snackbar;

    // const openSnackbar = (content, severity) => {
    //     setSnackbar({ ...snackbar, open: true, content: content, severity: severity });
    // };

    // const closeSnackbar = () => {
    //     setSnackbar({ ...snackbar, open: false });
    // };

    // ----------------------------------------------------------------

    return (
        <>
            <Routes>
                <Route path='/' element={
                    <>
                        <Navbar />
                        <Container sx={{ mt: 8, mb: 8 }}>
                            <Outlet />
                        </Container>
                    </>
                }>
                    <Route path='' element={<Home />} />
                </Route>
                {/* <Route path='/user/signup' element={
                    <SignUp setTrigger={setTrigger} />}
                /> */}
            </Routes>
            {/* <Snackbar
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
            </Snackbar> */}
        </>
    );
}