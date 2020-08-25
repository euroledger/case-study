import React from 'react';
import { TextField } from "@material-ui/core";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';
import Spinner from '../Spinner';
import Collapse from '@material-ui/core/Collapse';
import CloseIcon from '@material-ui/icons/Close';
import Alert from '@material-ui/lab/Alert';
import IconButton from '@material-ui/core/IconButton';

const LoginDialog = ({ form_open, parent, login_loading, collapse_open }) => {
    const [passcode, setPassCode] = React.useState('');

    const handleLoginFormSubmit = (event) => {
        event.preventDefault();
        console.log("passcode = ", passcode);
        parent.postLogin(passcode);
    }

    const handleLoginClose = () => {
        parent.handleLoginClose();
    }

  
    return (
        <Dialog open={form_open} onClose={() => handleLoginClose()} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Login</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please enter the passcode generated for your registration credentials, or register as a new user by clicking on "Register"
                </DialogContentText>
                <form noValidate autoComplete="off" onSubmit={(e) => handleLoginFormSubmit(e)}>
                    <Spinner active={login_loading}></Spinner>
                    <TextField
                        margin="dense"
                        id="passcode"
                        label="Passcode"
                        type="text"
                        onChange={(e) => setPassCode(e.target.value)}
                        fullWidth
                    />
                    <DialogActions>
                        <Button onClick={() => handleLoginClose()} color="primary">
                            Cancel
                                </Button>
                        <Button type="submit" onClick={() => parent.startLoader()} color="primary">
                            Login
                                </Button>
                    </DialogActions>
                </form>
                <Collapse in={collapse_open} style={{
                    position: 'absolute',
                    top: '40%',
                    left: '25%',
                    width: '20rem'
                }}>
                    <Alert
                        severity="error"
                        action={
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={() => {
                                    parent.setCollapseClosed()
                                }}
                            >
                                <CloseIcon fontSize="inherit" />
                            </IconButton>
                        }
                    >
                        Invalid Passcode: connection not found. Please try again.
                                        </Alert>
                </Collapse>
            </DialogContent>
        </Dialog>
    );
}

export default LoginDialog;