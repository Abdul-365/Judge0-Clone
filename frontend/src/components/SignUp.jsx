import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function TextFieldx({ children, ...other }) {
    return (
        <TextField
            variant="outlined"
            sx={{
                mb: 2,
                '& .Mui-focused.MuiFormLabel-root': {
                    color: 'text.secondary',
                },
                '& .MuiFormLabel-filled.MuiFormLabel-root': {
                    display: 'none',
                }
            }}
            InputLabelProps={{ shrink: false }}
            {...other}
        >
            {children}
        </TextField>
    );
}

export default function SignUp({ setTrigger, openSnackbar }) {

    const navigate = useNavigate();

    async function loginUser() {
        const loginDetails = {
            email: signUpInfo.email,
            password: signUpInfo.password,
        };

        axios.post(`${process.env.REACT_APP_BACKEND_URL}/user/signin`, loginDetails, { withCredentials: true })
            .then(() => {
                setTrigger(prevValue => !prevValue)
                navigate('/');
            })
            .catch((error) => console.log(error));
    }

    const [signUpInfo, setSignUpInfo] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleChange = (event) => {
        setSignUpInfo({ ...signUpInfo, [event.target.name]: event.target.value });
    };

    async function createUser(e) {
        e.preventDefault();

        axios.post(`${process.env.REACT_APP_BACKEND_URL}/signup`, signUpInfo, { withCredentials: true })
            .then((response) => {
                if (response) {
                    openSnackbar('Account created successfully', 'success');
                    loginUser();
                }
            })
            .catch((error) => {
                openSnackbar('Account could not be created', 'error');
                console.log(error);
            });
    }

    return (
        <Container sx={{ mt: 8, mb: 5 }}>
            <Card sx={{ width: 500, mx: 'auto' }}>
                <CardContent sx={{ p: 5 }} component='form' onSubmit={createUser}>
                    <Stack>
                        <Typography align='center' variant='h4' mt={2} gutterBottom>LOGO</Typography>
                        <Typography align='center' variant='h6' mb={5}>Create Your Account</Typography>
                        <Typography variant='subtitle2' gutterBottom>First Name</Typography>
                        <TextFieldx
                            value={signUpInfo.name}
                            onChange={handleChange}
                            name='firstName'
                            label="Enter your Name"
                        />
                        <Typography variant='subtitle2' gutterBottom>Email</Typography>
                        <TextFieldx
                            value={signUpInfo.email}
                            onChange={handleChange}
                            name='email'
                            type='email'
                            label="example@mail.com"
                        />
                        <Typography variant='subtitle2' gutterBottom>Password</Typography>
                        <TextFieldx
                            value={signUpInfo.password}
                            onChange={handleChange}
                            name='password'
                            type='password'
                            label="*********"
                        />
                        <Typography mt={3} variant="subtitle2">
                            {'Already have an account? '}
                            <Link component={RouterLink} to='/signin'>
                                Sign In
                            </Link>
                        </Typography>
                        <Button variant='contained' size='large' type='submit' sx={{ mt: 5, mb: 3 }}>Submit</Button>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    )
}
