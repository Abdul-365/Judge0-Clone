import React from 'react'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function OutputWindow({ output, status }) {
    return (
        <Box position='relative'>
            <Typography
                component='pre'
                color='white'
                variant='body2'
                sx={{
                    fontFamily: 'consolas, monospace',
                    overflowY: 'auto',
                    backgroundColor: '#1E1E1E',
                    p: 2,
                    height: '36em'
                }}>
                {output}
            </Typography>
            {status === 'Processing' &&
                <CircularProgress
                    sx={{
                        position: 'absolute',
                        margin: 'auto',
                        top: 0,
                        bottom: 0,
                        right: 0,
                        left: 0,
                    }}
                    size={50}
                    thickness={4}
                />}
        </Box>
    )
}