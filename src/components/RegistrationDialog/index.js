import React from 'react';
import { TextField } from "@material-ui/core";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';

const RegistrationDialog = ({ form_open, parent, registerFormOpen, setQRFormOpen, postRegister }) => {
    let initialFormState =
    {
        firstname: '',
        lastname: '',
        email: '',
        country: ''
    };

    const [form, setFormState] = React.useState(initialFormState);

    const handleRegisterClose = () => {
        parent.registerFormOpen(false);
    }

    const setFieldValue = (event) => {
        const { target: { name, value } } = event;
        setFormState({ ...form, [name]: value });
    }

    const handleFormSubmit = (event) => {
        event.preventDefault();
        parent.setQRFormOpen(true);
        parent.postRegister(form);
    }
    
    return (
        <Dialog open={form_open} onClose={() => handleRegisterClose()} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Register</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    To register to this website, please enter your name, email address and location here.
                                </DialogContentText>
                <form noValidate autoComplete="off" onSubmit={(e) => handleFormSubmit(e)}>
                    <TextField
                        margin="dense"
                        name="firstname"
                        label="First Name"
                        value={form.firstname}
                        onChange={setFieldValue}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        name="lastname"
                        label="Last Name"
                        value={form.lastname}
                        onChange={setFieldValue}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        name="email"
                        label="Email Address"
                        value={form.email}
                        onChange={setFieldValue}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        name="country"
                        label="Country"
                        value={form.country}
                        onChange={setFieldValue}
                        fullWidth
                    />
                    <DialogActions>
                        <Button onClick={() => handleRegisterClose()} color="primary">
                            Cancel
                    </Button>
                        <Button type="submit" onClick={() => handleRegisterClose()} color="primary">
                            Register
                    </Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
export default RegistrationDialog