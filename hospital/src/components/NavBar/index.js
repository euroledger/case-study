import React from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Typography from "@material-ui/core/es/Typography/Typography";
import Button from '@material-ui/core/Button';

const NavBar = ({ parent }) => {
    
    const clickHandler = () => {
        if (parent.state.login === true) {
            parent.logout()
        } else {
            parent.postLogin()
        }
    }

    return (
        <AppBar position="static">
            <Toolbar style={{ backgroundColor: '#800000' }}>
                <img style = {{maxHeight: '40px', paddingRight: '30px'}} src="stelsewhere.png" alt="logo" />
                <Typography variant="h6">
                    St Elsewhere Hospital Demo
                        </Typography>
                <div style={{ flexGrow: 1 }}></div>
                <Button style={{ color: 'white' }} onClick={() => parent.registerFormOpen(true)}>
                    {parent.getRegisterLabel()}
                        </Button>
                <Button style={{ color: 'white' }} onClick={() => clickHandler()}>
                    {parent.getLoginLabel()}
                </Button>
            </Toolbar>
        </AppBar>
    )
};

export default NavBar
