import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import Navbar from '../components/navbar';
import { useNavigate, useLocation } from 'react-router';
import './findstores.css';

const mapContainerStyle = {
    width: '100%',
    height: '450px',
};

const DEFAULT_LOCATION = { lat: 1.3048, lng: 103.8318 };
const LOCAL_STORAGE_KEY = 'budgetBitesLocation';
const DENIED_FLAG_KEY = 'budgetBitesLocationDenied';
const LIBRARIES = ['places'];

function FindStores() {
    const [userLocation, setUserLocation] = useState(null);
    const [places, setPlaces] = useState([]);
    const [locationDenied, setLocationDenied] = useState(false);
    const [currentAddress, setCurrentAddress] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    const autocompleteRef = useRef(null);
    const mapRef = useRef(null);
    const cardRefs = useRef([]);

    const navigate = useNavigate();
    const location = useLocation();
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    const selectedIngredients = location.state?.selectedIngredients || [];
    const filteredRecipes = location.state?.filteredRecipes || [];
    const backPath = location.state?.from || '/home';

    const fetchNearbyPlaces = (loc) => {
        const service = new window.google.maps.places.PlacesService(mapRef.current);
        service.nearbySearch({
            location: loc,
            keyword: 'grocery store OR minimart OR supermarket OR wet market',
            rankBy: window.google.maps.places.RankBy.DISTANCE,
        }, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                setPlaces(results);
                setSelectedPlaceIndex(null);
            }
        });
    };

    const reverseGeocode = (latlng) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                setCurrentAddress(results[0].formatted_address);
            }
        });
    };

    const saveToLocalStorage = (coords, isManual = false) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ coords, isManual }));
        localStorage.setItem(DENIED_FLAG_KEY, 'false');
    };

    const loadFromLocalStorage = () => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return null;
            }
        }
        return null;
    };

    const clearLocalStorage = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(DENIED_FLAG_KEY);
    };

    const getUserLocation = useCallback(() => {
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(coords);
                setLocationDenied(false);
                saveToLocalStorage(coords, false);
                setIsLoadingLocation(false);
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationDenied(true);
                    localStorage.setItem(DENIED_FLAG_KEY, 'true');
                }
                setUserLocation(DEFAULT_LOCATION);
                setIsLoadingLocation(false);
            }
        );
    }, []);

    const handlePlaceSelected = () => {
        const place = autocompleteRef.current.getPlace();
        if (place && place.geometry) {
            const coords = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            };
            setUserLocation(coords);
            setLocationDenied(false);
            saveToLocalStorage(coords, true);
        }
    };

    useEffect(() => {
        const stored = loadFromLocalStorage();
        const denied = localStorage.getItem(DENIED_FLAG_KEY) === 'true';
        if (stored?.coords) {
            setUserLocation(stored.coords);
            if (stored.isManual || !denied) setLocationDenied(false);
            else setLocationDenied(true);
            setIsLoadingLocation(false);
        } else {
            getUserLocation();
        }
    }, [getUserLocation]);

    useEffect(() => {
        if (isScriptLoaded && userLocation && mapRef.current) {
            fetchNearbyPlaces(userLocation);
        }
    }, [isScriptLoaded, userLocation]);

    useEffect(() => {
        if (isScriptLoaded && userLocation) {
            reverseGeocode(userLocation);
        }
    }, [isScriptLoaded, userLocation]);

    const handleMapLoad = (map) => {
        mapRef.current = map;
        if (userLocation) {
            fetchNearbyPlaces(userLocation);
        }
    };

    const scrollToCard = (index) => {
        const card = cardRefs.current[index];
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <>
            <Navbar clearStoreLocation={clearLocalStorage} />
            <div className="store-wrapper">
                <div className="store-header">
                    <h3>
                        We found <span className="store-count">{places.length}</span> grocery stores near your current location:
                    </h3>

                    <LoadScript
                        googleMapsApiKey={apiKey}
                        libraries={LIBRARIES}
                        onLoad={() => setIsScriptLoaded(true)}
                    >
                        <div className="controls">
                            <div className="top-row">
                                <span className="location-display">
                                    <strong>Current location: </strong> {isLoadingLocation ? 'Loading...' : currentAddress}
                                </span>
                                <Autocomplete onLoad={(auto) => (autocompleteRef.current = auto)} onPlaceChanged={handlePlaceSelected}>
                                  <input
                                      type="text"
                                      placeholder="Or enter location"
                                      className="manual-location-input"
                                  />
                                </Autocomplete>
                            </div>

                            {locationDenied && (
                                <div className="location-denied">
                                    ❗ Location access denied. Showing Orchard Road. To see nearby stores, please enable location access in your browser settings and refresh the page.
                                </div>
                            )}
                        </div>
                    </LoadScript>
                </div>

                <div className="store-content">
                    <div className="map-section">
                        <LoadScript
                            googleMapsApiKey={apiKey}
                            libraries={LIBRARIES}
                            onLoad={() => setIsScriptLoaded(true)}
                        >
                            {userLocation && !isLoadingLocation && (
                                <GoogleMap
                                    key={`${userLocation.lat}-${userLocation.lng}`}
                                    mapContainerStyle={mapContainerStyle}
                                    center={userLocation}
                                    zoom={15}
                                    onLoad={handleMapLoad}
                                >
                                    <Marker position={userLocation} label="You" />
                                    {places.map((place, i) => (
                                      <Marker
                                          key={i}
                                          position={{
                                              lat: place.geometry.location.lat(),
                                              lng: place.geometry.location.lng(),
                                          }}
                                          onClick={() => {
                                              setSelectedPlaceIndex(i);
                                              scrollToCard(i);
                                          }}
                                          animation={selectedPlaceIndex === i ? window.google.maps.Animation.BOUNCE : undefined}
                                      />
                                     ))}
                                </GoogleMap>
                            )}
                        </LoadScript>
                    </div>

                    <div className="list-section">
                        {places.map((place, i) => (
                            <div
                                key={i}
                                ref={(el) => (cardRefs.current[i] = el)}
                                className={`store-card ${selectedPlaceIndex === i ? 'highlight' : ''}`}
                                onClick={() => {
                                    setSelectedPlaceIndex(i);
                                    if (mapRef.current && place.geometry?.location) {
                                        mapRef.current.panTo(place.geometry.location);
                                    }
                                }}
                            >
                                <strong>{place.name}</strong>
                                <p>{place.vicinity}</p>
                                <p>{place.opening_hours?.open_now ? 'Open Now' : 'Closed'}</p>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        place.name + ' ' + place.vicinity
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View on Google Maps
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    className="back-button"
                    onClick={() => navigate(backPath, { state: { selectedIngredients, filteredRecipes } })}
                >
                    ← Back
                </button>
            </div>
        </>
    );
}

export default FindStores;
