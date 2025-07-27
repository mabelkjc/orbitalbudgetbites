import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import ProfilePage from './profile';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getDoc, getDocs } from 'firebase/firestore';

jest.mock('firebase/firestore');
jest.mock('react-firebase-hooks/auth');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

describe('ProfilePage', () => {
    const mockUser = { uid: 'mockUserId' };
    const mockUserData = {
        username: 'mockuser',
        dietaryPreferences: ['Vegan'],
        allergies: ['Nut'],
        restrictions: ['Low-sugar'],
        profilePicture: '/avatars/boba.png',
        followers: ['user123'],
        following: ['user456'],
        savedRecipes: ['recipe1'],
        ratedRecipes: ['recipe2'],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuthState.mockReturnValue([mockUser, false]);
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => mockUserData,
        });
        getDocs.mockResolvedValue({ docs: [] }); // for recipe and community fetches
    });

    const renderProfile = (route = '/profile') => {
        render(
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                </Routes>
            </MemoryRouter>
        );
    };

    test('displays loading state initially if userData not ready', async () => {
        useAuthState.mockReturnValue([mockUser, true]);
        renderProfile();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('renders profile data correctly for own profile', async () => {
        renderProfile();

        await waitFor(() => {
            expect(screen.getByText('mockuser')).toBeInTheDocument();
        });

        expect(screen.getByText('Edit Preferences')).toBeInTheDocument();
        expect(screen.getByText('Vegan')).toBeInTheDocument();
        expect(screen.getByText('Nut')).toBeInTheDocument();
        expect(screen.getByText('Low-sugar')).toBeInTheDocument();
    });

    test('renders profile data correctly for another user', async () => {
        useAuthState.mockReturnValue([{ uid: 'viewerId' }, false]);
        renderProfile('/profile/mockUserId');

        await waitFor(() => {
            expect(screen.getByText('mockuser')).toBeInTheDocument();
        });

        expect(screen.queryByText('Edit Preferences')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
    });

    test('displays follower and following counts', async () => {
        renderProfile();

        await waitFor(() => {
            expect(screen.getByText('mockuser')).toBeInTheDocument();
        });

        const counts = screen.getAllByText('1');
        expect(counts.length).toBeGreaterThanOrEqual(2);
        expect(counts[0]).toHaveTextContent('1'); // follower
        expect(counts[1]).toHaveTextContent('1'); // following
    });

    test('displays message when no saved or rated recipes', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ ...mockUserData, savedRecipes: [], ratedRecipes: [] }),
        });

        renderProfile();

        await waitFor(() => {
            expect(screen.getByText('No recipes saved yet.')).toBeInTheDocument();
            expect(screen.getByText('No recipes rated yet.')).toBeInTheDocument();
        });
    });

    test('displays message when no liked or created posts', async () => {
        renderProfile();

        await waitFor(() => {
            expect(screen.getByText('No posts liked yet.')).toBeInTheDocument();
            expect(screen.getByText('No posts created yet.')).toBeInTheDocument();
        });
    });

    test('can follow and unfollow another user', async () => {
        useAuthState.mockReturnValue([{ uid: 'viewerId' }, false]);

        const getDocMock = getDoc;
        getDocMock
            .mockResolvedValueOnce({ // target profile
                exists: () => true,
                data: () => ({
                    ...mockUserData,
                    followers: ['viewerId'], // already followed
                }),
            })
            .mockResolvedValueOnce({ // viewer
                exists: () => true,
                data: () => ({
                    uid: 'viewerId',
                    following: ['mockUserId'],
                }),
            })
            .mockResolvedValueOnce({ // viewer again
                exists: () => true,
                data: () => ({
                    uid: 'viewerId',
                    following: ['mockUserId'],
                }),
            })
            .mockResolvedValueOnce({ // target again
                exists: () => true,
                data: () => ({
                    ...mockUserData,
                    followers: ['viewerId'],
                }),
            });

        renderProfile('/profile/mockUserId');

        const unfollowButton = await screen.findByRole('button', { name: /unfollow/i });
        expect(unfollowButton).toBeInTheDocument();

        fireEvent.click(unfollowButton);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
        });
    });

    test('allows avatar selection and updates Firestore', async () => {
        useAuthState.mockReturnValue([mockUser, false]);

        getDocs.mockResolvedValueOnce({ docs: [] });

        renderProfile();

        const editLabel = await screen.findByText('Edit Avatar');
        fireEvent.click(editLabel);

        const avatarOption = await screen.findByAltText('boba.png');
        fireEvent.click(avatarOption);

        await waitFor(() => {
            expect(screen.getByAltText('Profile').getAttribute('src')).toContain('boba.png');
        });
    });

    test('navigates to preferences page when Edit Preferences clicked', async () => {
        const mockNavigate = jest.fn();
        useNavigate.mockReturnValue(mockNavigate);
        useAuthState.mockReturnValue([mockUser, false]);

        getDocs.mockResolvedValueOnce({ docs: [] });

        renderProfile();

        const editButton = await screen.findByText('Edit Preferences');
        fireEvent.click(editButton);

        expect(mockNavigate).toHaveBeenCalledWith('/profile/preferences', {
            state: { from: 'profile' }
        });
    });
});