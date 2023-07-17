import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const links = [
    { name: 'Code Editor', to: '/' },
    { name: 'Submissions', to: '/submissions', auth: true },
    { name: 'Sign In', to: '/signin', auth: false },
]

export default function Navbar({ user, setTrigger, openSnackbar, setCodeValues, setResult }) {

    const [state, setState] = useState(false);

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift'))
            return;
        setState(open);
    };

    const navigate = useNavigate();

    async function logOutUser() {
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/user/signout`, { withCredentials: true })
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
        <>
            <Button onClick={toggleDrawer(true)}>
                <MenuIcon />
            </Button>
            <Drawer
                anchor='left'
                open={state}
                onClose={toggleDrawer(false)}
            >
                <Box
                    sx={{ width: 250 }}
                    role="presentation"
                    onClick={toggleDrawer(false)}
                    onKeyDown={toggleDrawer(false)}
                >
                    <List>
                        {links.map((link) => {
                            if ((!user && link.auth === true) || (user && link.auth === false))
                                return null;
                            return (
                                <ListItem key={link.name} disablePadding>
                                    <ListItemButton component={Link} to={link.to}>
                                        <ListItemText primary={link.name} />
                                    </ListItemButton>
                                </ListItem>
                            )
                        })}
                        {user &&
                            <ListItem disablePadding>
                                <ListItemButton onClick={logOutUser}>
                                    <ListItemText primary='Sign Out' />
                                </ListItemButton>
                            </ListItem>
                        }
                    </List>
                    <Divider />
                </Box>
            </Drawer>
        </>
    )
}