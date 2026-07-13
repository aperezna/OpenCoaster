import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('should render name input', () => {
    render(<SearchBar name="" onNameChange={() => {}} />);
    expect(screen.getByTestId('search-name-input')).toBeTruthy();
  });

  it('should call onNameChange when name input changes', () => {
    const onNameChange = jest.fn();
    render(<SearchBar name="" onNameChange={onNameChange} />);
    fireEvent.changeText(screen.getByTestId('search-name-input'), 'Magic');
    expect(onNameChange).toHaveBeenCalledWith('Magic');
  });

  it('should display current name value', () => {
    render(<SearchBar name="Magic" onNameChange={() => {}} />);
    const nameInput = screen.getByTestId('search-name-input');
    expect(nameInput.props.value).toBe('Magic');
  });
});
