import React from 'react';
import {Checkbox, FormControlLabel, FormGroup, Typography} from "@material-ui/core";
import {DirectionsBike, DriveEta} from "@material-ui/icons";
import {Box, IconButton} from "@mui/material";

function TransportOptions(props) {

    const transportOptions = [
        {label: "Car", value: "Car", icon: <DriveEta style={{height: 20, width: 17}}/>},
        {label: "Bicycle", value: "Bicycle", icon: <DirectionsBike style={{height: 20, width: 17}}/>},
        // Add more options as needed
    ]

    const handleOptionChange = (option) => {
        props.handleOptionChange(option);
    };

    return (<FormGroup>
            <Typography style={{marginTop: '20px'}} variant="h2">Select Transport Options:</Typography>
            {transportOptions.map((option) => (
                <FormControlLabel
                    control={
                        <Checkbox size='small'
                                  checked={props.selectedOption === option.value}
                                  onChange={() => handleOptionChange(option.value)}
                                  color="default"
                                  disabled={props.selectedOption && props.selectedOption !== option.value}
                        />
                    }
                    label={
                        <Box display="flex"
                             alignItems="center">
                            <IconButton style={{minWidth: '25px'}}>{option.icon}</IconButton>
                            <Typography style={{fontSize: 9, color: '#424242'}}>{option.label}</Typography>
                        </Box>
                    }
                />
            ))}
        </FormGroup>
    );
}

export default TransportOptions;
