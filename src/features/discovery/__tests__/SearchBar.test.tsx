import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('should render name and city inputs', async () => {
    await render(
      <SearchBar
        name=""
        city=""
        onNameChange={() => {}}
        onCityChange={() => {}}
      />,
    );
    expect(screen.getByTestId('search-name-input')).toBeOnTheScreen();
    expect(screen.getByTestId('search-city-input')).toBeOnTheScreen();
  });

  it('should display placeholder texts', async () => {
    await render(
      <SearchBar
        name=""
        city=""
        onNameChange={() => {}}
        onCityChange={() => {}}
      />,
    );
    expect(screen.getByPlaceholderText('Park name')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('City')).toBeOnTheScreen();
  });

  it('should call onNameChange when name input changes', async () => {
    const onNameChange = jest.fn();
    await render(
      <SearchBar
        name=""
        city=""
        onNameChange={onNameChange}
        onCityChange={() => {}}
      />,
    );
    fireEvent.changeText(screen.getByTestId('search-name-input'), 'Magic');
    expect(onNameChange).toHaveBeenCalledWith('Magic');
  });

  it('should call onCityChange when city input changes', async () => {
    const onCityChange = jest.fn();
    await render(
      <SearchBar
        name=""
        city=""
        onNameChange={() => {}}
        onCityChange={onCityChange}
      />,
    );
    fireEvent.changeText(screen.getByTestId('search-city-input'), 'Orlando');
    expect(onCityChange).toHaveBeenCalledWith('Orlando');
  });

  it('should display current name and city values', async () => {
    await render(
      <SearchBar
        name="Magic"
        city="Orlando"
        onNameChange={() => {}}
        onCityChange={() => {}}
      />,
    );
    const nameInput = screen.getByTestId('search-name-input');
    const cityInput = screen.getByTestId('search-city-input');
    expect(nameInput.props.value).toBe('Magic');
    expect(cityInput.props.value).toBe('Orlando');
  });
});
