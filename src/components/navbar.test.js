global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from './navbar';
import { useAuthState } from 'react-firebase-hooks/auth';
import { BrowserRouter } from 'react-router';
import { signOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

jest.mock('react-firebase-hooks/auth', () => ({
    useAuthState: jest.fn(),
}));

jest.mock('../firebase', () => ({
    auth: {},
    db: {},
}));

jest.mock('firebase/auth', () => ({
    signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router', () => {
    const actual = jest.requireActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Navbar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sessionStorage.clear();
        localStorage.clear();

        getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({}),
        });
    });

    test('renders with user and loads profile picture from Firestore', async () => {
        useAuthState.mockReturnValue([{ uid: 'user123' }, false]);
        getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ profilePicture: 'http://example.com/pic.jpg' }),
        });

        render(
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
        );

        await waitFor(() => {
        expect(screen.getByAltText('User Avatar')).toHaveAttribute('src', 'http://example.com/pic.jpg');
        });

        expect(screen.getByText('Community')).toBeInTheDocument();
        expect(screen.getByText('Recipe Index')).toBeInTheDocument();
    });

    test('renders default profile picture if Firestore picture missing', async () => {
        useAuthState.mockReturnValue([{ uid: 'user123' }, false]);
        getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({}),
        });

        render(
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
        );

        await waitFor(() => {
        expect(screen.getByAltText('User Avatar')).toHaveAttribute('src', '/default-profile.png');
        });
    });

    test('shows dropdown when ▼ is clicked', () => {
        useAuthState.mockReturnValue([{ uid: 'user123' }, false]);

        render(
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
        );

        fireEvent.click(screen.getByText('▼'));
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('logout clears storage and navigates to login', async () => {
        useAuthState.mockReturnValue([{ uid: 'user123' }, false]);
        signOut.mockResolvedValue();

        render(
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
        );

        fireEvent.click(screen.getByText('▼'));
        fireEvent.click(screen.getByText('Logout'));

        await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    test('handles logout failure gracefully', async () => {
        const mockError = new Error('Logout failed');
        console.error = jest.fn();
        useAuthState.mockReturnValue([{ uid: 'user123' }, false]);
        signOut.mockRejectedValue(mockError);

        render(
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
        );

        fireEvent.click(screen.getByText('▼'));
        fireEvent.click(screen.getByText('Logout'));

        await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Logout failed:', mockError);
        });
    });

    test('handles Firestore error gracefully during profile load', async () => {
        const mockError = new Error('getDoc failed');
        console.error = jest.fn();
        useAuthState.mockReturnValue([{ uid: 'user123' }, false]);
        getDoc.mockRejectedValue(mockError);

        render(
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
        );

        await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load profile picture:', mockError);
        });
    });

    test('renders safely with no user', () => {
        useAuthState.mockReturnValue([null, false]);

        render(
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
        );

        expect(screen.getByText('Community')).toBeInTheDocument();
        expect(screen.getByAltText('User Avatar')).toHaveAttribute('src', '/default-profile.png');
    });
});
