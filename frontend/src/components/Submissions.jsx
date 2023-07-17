import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import languages from '../languages.json';

export default function Submissions({ setCodeValues, setResult, openSnackbar }) {

    const [codes, setCodes] = useState(null);
    const [trigger, setTrigger] = useState(true);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/codes`, { withCredentials: true })
            .then(({ data }) => setCodes(data))
            .catch((err) => console.log(err));
    }, [trigger])

    const navigate = useNavigate();

    function viewCode(code) {
        setCodeValues({
            id: code._id,
            name: code?.name,
            source_code: code?.source_code,
            language_id: code?.language_id,
            stdin: code?.stdin,
        })
        setResult({
            stdout: code?.stdout,
            stderr: code?.stderr,
            compile_output: code?.compile_output,
            time: code?.time,
            memory: code?.memory,
            status: code?.status
        })
        navigate('/');
    }

    function deleteCode(e, codeId) {
        e.stopPropagation();
        axios.delete(`${process.env.REACT_APP_BACKEND_URL}/code/${codeId}`, { withCredentials: true })
            .then(() => {
                openSnackbar('Deleted successfully', 'success')
                setTrigger(!trigger);
            })
            .catch((error) => {
                openSnackbar('Could not delete', 'error');
                console.log(error);
            });
    }

    if (!codes) return null;
    if (codes.length === 0) return (
        <Typography variant='h4' textAlign={'center'}>No Submissions</Typography>
    )
    return (
        <Box width='50%' m='auto'>
            {codes.map(code => (
                <Card
                    elevation={3}
                    sx={{ minWidth: 275, mb: 2, borderRadius: '0.5rem' }}
                    key={code._id}
                    onClick={() => viewCode(code)}
                >
                    <CardContent sx={{
                        p: 2,
                        "&:last-child": {
                            pb: 2,
                        },
                    }}>
                        <Grid container alignItems='center' rowSpacing={{ xs: 1, md: 'none' }} columnSpacing={2}>
                            <Grid item xs={7}>
                                <Typography
                                    sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                    {code.name}
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography
                                    sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                    {languages.find(item => item.id === code.language_id).name}
                                </Typography>
                            </Grid>
                            <Grid item xs={1} display='flex' justifyContent='flex-end'>
                                <IconButton size='small' onClick={(e) => deleteCode(e, code._id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            ))}
        </Box>
    )
}
