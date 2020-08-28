import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from "@material-ui/core/es/Typography/Typography";
import { TextField } from "@material-ui/core";
import Spinner from '../Spinner';

const Form = ({ parent, items, loading, card, title, action }) => {
    const getButton = () => {
        if (action === "policy") {
            return parent.requestPolicyButton();
        } else if (action === "invoice") {
            return parent.invoiceButton();
        } 
    }

    const getLogo = () => {
        if (action === "policy") {
            return (
                <img style={{ marginLeft: '177px', height: '99px', width: '143px', marginBottom:'24px' }} src='policy.jpg' alt=""/>
            )
        } else if (action === "invoice") {
            return (
                <img style={{ marginLeft: '194px', height: '98px', width: '165px' }} src='nurse.jpg' alt=""/>
            )
        } 
    }

    const getDivStyle = () => {
        if (action === "policy") {
            return ({ display: 'flex', marginBottom: '-65px' })
        } else if (action === "invoice") {
            return ({ display: 'flex', marginBottom: '-3px' })
        }
    }

    const setFieldValue = (event) => {
        if (action === "policy") {
            parent.setPolicyFieldValue(event);
        } else if (action === "invoice") {
            parent.setInvoiceFieldValue(event);
        } 
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.9 }}>
            <Paper style={{ display: 'flex', maxWidth: '1000px', width: '650px'}}>
                <div style={{ display: 'flex', padding: '24px 24px', flexDirection: 'column', width: '100%' }}>
                    <div style={getDivStyle()}>
                        <Typography variant="h5" style={{ flexGrow: 1 }}>
                            <div style={{ display: 'flex' }}>
                                <div>
                                    {title}
                                </div>
                                <div>
                                    {getLogo()}
                                </div>
                            </div>

                        </Typography>
                    </div>

                    <Spinner active={loading}></Spinner>
                    {items.map(item => (
                        <TextField
                            name={item.id}
                            disabled={item.disabled}
                            label={item.label}
                            value={card[item.id]}
                            onChange={setFieldValue}
                            style={{ marginBottom: '12px' }}
                        />
                    ))}
                    {getButton()}
                </div>
            </Paper>
        </div>
    );
}

export default Form;