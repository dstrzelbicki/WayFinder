import React from 'react';
import {Checkbox, FormControlLabel, FormGroup, Typography} from "@material-ui/core";
import {DirectionsBike, DriveEta} from "@material-ui/icons";
import {Box, Icon} from "@mui/material";

function TransportOptions(props) {

    const transportOptions = [
        {label: "Car", value: "Car", icon: <DriveEta style={{height: 20, width: 17}}/>},
        {label: "Bicycle", value: "Bicycle", icon: <DirectionsBike style={{height: 20, width: 17}}/>},
        // Add more options as needed
    ]

    const handleOptionChange = (option) => {
        props.handleOptionChange(option)
    }

    return (<FormGroup>
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
                            <Icon style={{blockSize: 40}}>{option.icon}</Icon>
                            <Typography style={{fontSize: 9, color: '#424242', marginLeft: 10}}>{option.label}</Typography>
                        </Box>
                    }
                />
            ))}
        </FormGroup>
    )
}

export default TransportOptions;
