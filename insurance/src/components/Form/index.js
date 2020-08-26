import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from "@material-ui/core/es/Typography/Typography";
import { TextField } from "@material-ui/core";
import Spinner from '../Spinner';

const Form = ({ parent, items, loading, card, title, action }) => {
    const getButton = () => {
        if (action === "policy") {
            return parent.issuePolicyButton();
        } else if (action === "claim") {
            return parent.claimButton();
        } 
    }

    const getLogo = () => {
        if (action === "policy") {
            return (
                <img style={{ marginLeft: '127px', height: '99px', width: '143px', marginBottom:'24px' }} src='wellness.jpg' alt=""/>
            )
        } else if (action === "claim") {
            return (
                <img style={{ marginLeft: '288px', height: '90px', width: '155px' }} src='claim.jpg' alt=""/>
            )
        } 
    }

    const getDivStyle = () => {
        if (action === "policy") {
            return ({ display: 'flex', marginBottom: '-65px' })
        } else if (action === "claim") {
            return ({ display: 'flex', marginBottom: '-3px' })
        }
    }

    const setFieldValue = (event) => {
        if (action === "policy") {
            parent.setPolicyFieldValue(event);
        } else if (action === "claim") {
            parent.setClaimFieldValue(event);
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