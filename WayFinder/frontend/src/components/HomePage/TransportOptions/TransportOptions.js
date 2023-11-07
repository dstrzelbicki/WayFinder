import React from 'react';
import {Checkbox, FormControlLabel, FormGroup, ListItemIcon, Typography} from "@material-ui/core";
import {DirectionsBike, DriveEta} from "@material-ui/icons";
import "./TransportOptions.css"

function TransportOptions(props) {

    const transportOptions = [
        {label: "Car", value: "Car", icon: <DriveEta/>},
        {label: "Bicycle", value: "Bicycle", icon: <DirectionsBike/>},
        // Add more options as needed
    ]

    const handleOptionChange = (option) => {
        props.handleOptionChange(option);
    };

    return (<div className="transport-options-container">
            <Typography variant="subtitle1">Select Transport Options:</Typography>
            <FormGroup>
                {transportOptions.map((option) => (
                    <FormControlLabel
                        key={option.value}
                        control={
                            <Checkbox
                                checked={props.selectedOption === option.value}
                                onChange={() => handleOptionChange(option.value)}
                                color="primary"
                                disabled={props.selectedOption && props.selectedOption !== option.value}
                            />
                        }
                        label={
                            <div>
                                <ListItemIcon>{option.icon}</ListItemIcon>
                                <span>{option.label}</span>
                            </div>
                        }
                    />
                ))}
            </FormGroup>
        </div>
    );
}

export default TransportOptions;
