import React, {useState} from 'react';
import {Checkbox, FormControlLabel, FormGroup, Typography} from "@material-ui/core";
import {DirectionsBike, DirectionsWalk, DriveEta, LocalShipping, Motorcycle} from "@material-ui/icons";
import {Box, Icon, IconButton} from "@mui/material";
import "./TransportOptions.css"

function TransportOptions(props) {

    const transportOptions = [
        {label: "Car", value: "Car", icon: <DriveEta style={{height: 20, width: 17}}/>},
        {label: "Bicycle", value: "Bicycle", icon: <DirectionsBike style={{height: 20, width: 17}}/>},
        {label: "Truck", value: "Truck", icon: <LocalShipping style={{height: 20, width: 17}}/>},
        {label: "Motorcycle", value: "Motorcycle", icon: <Motorcycle style={{height: 20, width: 17}}/>},
        {label: "Walk", value: "Walk", icon: <DirectionsWalk style={{height: 20, width: 17}}/>}
        // Add more options as needed
    ]

    const [selectedOption, setSelectedOption] = useState(null)
    const [originSelectedOption, setOriginSelectedOption] = useState('')

    const handleOptionChange = (option) => {
        props.handleOptionChange(option)
        if (props.isStopoverOption)
            setSelectedOption(option)
        else setOriginSelectedOption((prevState) => prevState === option ? '' : option)
    }

    return (props.isStopoverOption ? (
            <div className="stopover-container">
                {transportOptions.map((option) => (
                    <Box key={option.value}>
                        <IconButton
                            disableRipple={true}
                            style={{
                                blockSize: 50,
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                color: selectedOption ? (selectedOption === option.value ? 'black' : '#888888') : 'black',
                                padding: '3px'
                            }}
                            onClick={() => handleOptionChange(option.value)}
                        >
                            {option.icon}
                        </IconButton>
                    </Box>
                ))}
            </div>
        ) : (<FormGroup>
                {transportOptions.map((option) => (
                        <FormControlLabel
                            control={
                                <Checkbox size='small'
                                          checked={originSelectedOption === option.value}
                                          onChange={() => handleOptionChange(option.value)}
                                          color="default"
                                          disabled={originSelectedOption && originSelectedOption !== option.value}
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
                <Typography variant="h2">Selected Option: {originSelectedOption}</Typography>
            </FormGroup>
        )
    )
}

export default TransportOptions;
