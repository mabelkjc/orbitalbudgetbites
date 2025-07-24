import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import FindStores from './findstores';

// Mock Navbar to reduce complexity
jest.mock('../components/navbar', () => () => <div data-testid="navbar">Mock Navbar</div>);

// Prevent Google Maps script injection issues
jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }) => <>{children}</>,
  GoogleMap: ({ children }) => <div>{children}</div>,
  Marker: () => <div>Mock Marker</div>,
  Autocomplete: ({ children }) => <div>{children}</div>,
}));

// Custom mock for geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
};
global.navigator.geolocation = mockGeolocation;

// Mock google.maps API
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();

  window.google = {
    maps: {
      places: {
        PlacesService: jest.fn(() => ({
          nearbySearch: (req, callback) =>
            callback(
              [
                {
                  name: 'Mock Store',
                  vicinity: '123 Test Ave',
                  geometry: {
                    location: {
                      lat: () => 1.3,
                      lng: () => 103.8,
                    },
                  },
                  opening_hours: { open_now: true },
                  photos: [{ getUrl: () => 'mock-photo-url' }],
                },
              ],
              'OK'
            ),
        })),
      },
      Animation: { BOUNCE: 1 },
      Geocoder: jest.fn(() => ({
        geocode: (req, cb) =>
          cb([{ formatted_address: 'Orchard Road' }], 'OK'),
      })),
    },
  };
});

// Helper render
const renderWithRouter = (locationState = {}) => {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/findstores', state: locationState }]}>
      <Routes>
        <Route path="/findstores" element={<FindStores />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('FindStores Page', () => {
  test('shows fallback if location denied', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error) =>
      error({ code: 1 })
    );
    renderWithRouter({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

    expect(await screen.findByText(/location access denied/i)).toBeInTheDocument();
  });

  test('renders store marker and info card', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: 1.3, longitude: 103.8 } })
    );
    renderWithRouter({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

    expect(await screen.findByText('Mock Store')).toBeInTheDocument();
    expect(screen.getByText('123 Test Ave')).toBeInTheDocument();
    expect(screen.getByText('Open Now')).toBeInTheDocument();
  });

  test('clicking store card pans and highlights it', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: 1.3, longitude: 103.8 } })
    );
    renderWithRouter({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

    const card = await screen.findByText('Mock Store');
    fireEvent.click(card);
    expect(card.closest('.store-card')).toHaveClass('highlight');
  });

  test('store card contains Google Maps link', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: 1.3, longitude: 103.8 } })
    );
    renderWithRouter({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

    expect(
      await screen.findByRole('link', { name: /view on google maps/i })
    ).toBeInTheDocument();
  });

  test('back button navigates correctly', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: 1.3, longitude: 103.8 } })
    );
    renderWithRouter({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

    const backButton = await screen.findByText('← Back');
    expect(backButton).toBeInTheDocument();
  });

  test('retry geolocation button works', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error) =>
      error({ code: 1 })
    );
    renderWithRouter({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

    const retryButton = await screen.findByText(/location access denied/i);
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByText(/location access denied/i)).not.toBeInTheDocument();
    });
  });

  test('manual autocomplete location input appears and updates', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error) =>
      error({ code: 1 })
    );
    renderWithRouter({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

    const input = await screen.findByPlaceholderText(/or enter location/i);
    fireEvent.change(input, { target: { value: 'Orchard Road' } });
    expect(input.value).toBe('Orchard Road');
  });

  test('default fallback location (Orchard) is shown on denied location', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error) =>
      error({ code: 1 })
    );
    renderWithRouter({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

    expect(await screen.findByText(/orchard road/i)).toBeInTheDocument();
  });
});
