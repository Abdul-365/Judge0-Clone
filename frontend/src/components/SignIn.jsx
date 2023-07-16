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

    const [loginInfo, setLoginInfo] = useState({
        email: '',
        password: '',
    });

    const handleChange = (event) => {
        setLoginInfo({ ...loginInfo, [event.target.name]: event.target.value });
    };

    async function loginUser(e) {
        e.preventDefault();

        axios.post(`${process.env.REACT_APP_BACKEND_URL}/user/signin`, loginInfo, { withCredentials: true })
            .then(() => {
                setTrigger(prevValue => !prevValue)
                navigate('/');
            })
            .catch((error) => {
                openSnackbar('An error occured', 'error');
                console.log(error);
            });
    }

    return (
        <Container sx={{ mt: 8, mb: 5 }}>
            <Card sx={{ width: 500, mx: 'auto' }}>
                <CardContent sx={{ p: 5 }} component='form' onSubmit={loginUser}>
                    <Stack>
                        <Typography align='center' variant='h6' mb={5}>Sign in to your Account</Typography>
                        <Typography variant='subtitle2' gutterBottom>Email</Typography>
                        <TextFieldx
                            value={loginInfo.email}
                            onChange={handleChange}
                            name='email'
                            type='email'
                            label="example@mail.com"
                        />
                        <Typography variant='subtitle2' gutterBottom>Password</Typography>
                        <TextFieldx
                            value={loginInfo.password}
                            onChange={handleChange}
                            name='password'
                            type='password'
                            label="*********"
                        />
                        <Typography mt={3} variant="subtitle2">
                            {'New User? '}
                            <Link component={RouterLink} to='/signup'>
                                Create an Account
                            </Link>
                        </Typography>
                        <Button variant='contained' size='large' type='submit' sx={{ mt: 5, mb: 3 }}>Submit</Button>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    )
}
