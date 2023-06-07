import React, {useState} from 'react';
import {Checkbox, FormControlLabel, FormGroup, Typography} from '@material-ui/core';
import './TransportOptions.css';

const TransportOptions = () => {
    const [selectedOption, setSelectedOption] = useState('');

    const handleOptionChange = (option) => {
        if (selectedOption === option) {
            setSelectedOption('');
        } else {
            setSelectedOption(option);
        }
    };

    const isOptionSelected = (option) => {
        return selectedOption === option;
    };

    return (
        <div className="transport-options-container">
            <Typography variant="h5">Select Transport Options:</Typography>
            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isOptionSelected('Car')}
                            onChange={() => handleOptionChange('Car')}
                            color="primary"
                            disabled={selectedOption && !isOptionSelected('Car')}
                        />
                    }
                    label="Car"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isOptionSelected('Bicycle')}
                            onChange={() => handleOptionChange('Bicycle')}
                            disabled={selectedOption && !isOptionSelected('Bicycle')}
                            color="primary"
                        />
                    }
                    label="Bicycle"
                />
            </FormGroup>
            <Typography variant="h6">Selected Options: {selectedOption}</Typography>
        </div>
    );
};

export default TransportOptions;
