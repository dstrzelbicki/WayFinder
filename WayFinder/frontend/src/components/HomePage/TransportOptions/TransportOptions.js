import React from 'react';
import {Checkbox, FormControlLabel, FormGroup, ListItemIcon, Typography} from "@material-ui/core";
import {DirectionsBike, DriveEta} from "@material-ui/icons";
import "./TransportOptions.css"

function TransportOptions(props) {

    const transportOptions = [
        {label: "Car", value: "Car", icon: <DriveEta style={{height: 20,  width: 17}}/>},
        {label: "Bicycle", value: "Bicycle", icon: <DirectionsBike style={{height: 20,  width: 17}}/>},
        // Add more options as needed
    ]

    const handleOptionChange = (option) => {
        props.handleOptionChange(option);
    };

    return (<div className="transport-options-container">
            <Typography variant="h2">Select Transport Options:</Typography>
            <FormGroup>
                {transportOptions.map((option) => (
                    <FormControlLabel
                                      key={option.value}
                                      control={
                                          <Checkbox size='small'
                                              checked={props.selectedOption === option.value}
                                              onChange={() => handleOptionChange(option.value)}
                                              color="secondary"
                                              disabled={props.selectedOption && props.selectedOption !== option.value}
                                          />
                                      }
                                      label={
                                          <div className="transport-options-label">
                                              <ListItemIcon style={{minWidth: '25px'}}>{option.icon}</ListItemIcon>
                                              <span style={{fontSize:9}}>{option.label}</span>
                                          </div>
                                      }
                    />
                ))}
            </FormGroup>
        </div>
    );
}

export default TransportOptions;
