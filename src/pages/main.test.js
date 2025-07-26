import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainPage from './main';
import { MemoryRouter } from 'react-router-dom';
import { auth, db } from '../firebase';
import { getDoc, setDoc, doc } from 'firebase/firestore';

jest.mock('../firebase');
jest.mock('firebase/firestore');

describe('MainPage', () => {
    const mockUser = { uid: 'mockUserId' };

    beforeEach(() => {
        auth.currentUser = mockUser;
        jest.clearAllMocks();
    });

    const renderWithRouter = (ui, { route = '/' } = {}) => {
        window.history.pushState({}, 'Test page', route);
        return render(
            <MemoryRouter initialEntries={[route]}>
                {ui}
            </MemoryRouter>
        );
    };

    test('displays loading state initially', async () => {
        getDoc.mockResolvedValueOnce({ exists: () => false });
        renderWithRouter(<MainPage />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        await waitFor(() => expect(getDoc).toHaveBeenCalled());
    });

    test('renders with Firestore user data', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: ['Vegan'],
                allergies: ['Dairy'],
                restrictions: ['Low-sugar'],
            }),
        });

        renderWithRouter(<MainPage />);
        await waitFor(() => expect(screen.getByText('Welcome, mockUser')).toBeInTheDocument());

        expect(screen.getByLabelText('Vegan')).toBeChecked();
        expect(screen.getByLabelText('Dairy')).toBeChecked();
        expect(screen.getByLabelText('Low-sugar')).toBeChecked();
    });

    test('toggles individual checkboxes', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: [],
                allergies: [],
                restrictions: [],
            }),
        });

        renderWithRouter(<MainPage />);
        await waitFor(() => screen.getByText('Welcome, mockUser'));

        const ketoCheckbox = screen.getByLabelText('Keto');
        fireEvent.click(ketoCheckbox);
        expect(ketoCheckbox).toBeChecked();
    });

    test('selecting "None" unchecks all other dietary pref options', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: ['Vegan', 'Keto'],
                allergies: [],
                restrictions: [],
            }),
        });

        renderWithRouter(<MainPage />);
        await waitFor(() => screen.getByText('Welcome, mockUser'));

        const veganCheckbox = screen.getByLabelText('Vegan');
        const ketoCheckbox = screen.getByLabelText('Keto');
        const noneCheckbox = screen.getAllByLabelText('None')[0];

        expect(veganCheckbox).toBeChecked();
        expect(ketoCheckbox).toBeChecked();

        fireEvent.click(noneCheckbox);

        expect(noneCheckbox).toBeChecked();
        expect(veganCheckbox).not.toBeChecked();
        expect(ketoCheckbox).not.toBeChecked();
    });

    test('selecting a dietary pref option unchecks "None"', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: ['None'],
                allergies: [],
                restrictions: [],
            }),
        });

        renderWithRouter(<MainPage />);
        await waitFor(() => screen.getByText('Welcome, mockUser'));

        const noneCheckbox = screen.getAllByLabelText('None')[0];
        const halalCheckbox = screen.getByLabelText('Halal');

        expect(noneCheckbox).toBeChecked();

        fireEvent.click(halalCheckbox);

        expect(noneCheckbox).not.toBeChecked();
        expect(halalCheckbox).toBeChecked();
    });

    test('alerts if any section is unselected on save', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: [],
                allergies: [],
                restrictions: [],
            }),
        });

        window.alert = jest.fn();

        renderWithRouter(<MainPage />);
        await waitFor(() => screen.getByText('Welcome, mockUser'));

        fireEvent.click(screen.getByText(/save preferences/i));

        expect(window.alert).toHaveBeenCalledWith(
            'Please select at least one option for Dietary Preferences, Allergies, and Restrictions.'
        );
    });

    test('saves preferences and shows alert then navigates', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: ['Halal'],
                allergies: ['Egg'],
                restrictions: ['Low-sugar'],
            }),
        });

        setDoc.mockResolvedValueOnce();
        window.alert = jest.fn();

        renderWithRouter(<MainPage />, { route: '/main' });

        await waitFor(() => screen.getByText('Welcome, mockUser'));

        fireEvent.click(screen.getByText(/save preferences/i));

        await waitFor(() => {
            expect(setDoc).toHaveBeenCalledWith(
                doc(db, 'users', 'mockUserId'),
                {
                    dietaryPreferences: ['Halal'],
                    allergies: ['Egg'],
                    restrictions: ['Low-sugar'],
                },
                { merge: true }
            );
            expect(window.alert).toHaveBeenCalledWith('Preferences saved!');
        });
    });

    test('selecting "None" unchecks all other allergy options', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: [],
                allergies: ['Nut', 'Shellfish'],
                restrictions: [],
            }),
        });

        renderWithRouter(<MainPage />);
        await waitFor(() => screen.getByText('Welcome, mockUser'));

        const nutCheckbox = screen.getByLabelText('Nut');
        const shellfishCheckbox = screen.getByLabelText('Shellfish');
        const noneCheckbox = screen.getAllByLabelText('None')[1];

        expect(nutCheckbox).toBeChecked();
        expect(shellfishCheckbox).toBeChecked();

        fireEvent.click(noneCheckbox);

        expect(noneCheckbox).toBeChecked();
        expect(nutCheckbox).not.toBeChecked();
        expect(shellfishCheckbox).not.toBeChecked();
    });

    test('selecting an allergy option unchecks "None"', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: [],
                allergies: ['None'],
                restrictions: [],
            }),
        });

        renderWithRouter(<MainPage />);
        await waitFor(() => screen.getByText('Welcome, mockUser'));

        const noneCheckbox = screen.getAllByLabelText('None')[1];
        const dairyCheckbox = screen.getByLabelText('Dairy');

        expect(noneCheckbox).toBeChecked();

        fireEvent.click(dairyCheckbox);

        expect(dairyCheckbox).toBeChecked();
        expect(noneCheckbox).not.toBeChecked();
    });

    test('selecting "None" unchecks all other restriction options', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: [],
                allergies: [],
                restrictions: ['Pork-free', 'Alcohol-free'],
            }),
        });

        renderWithRouter(<MainPage />);
        await waitFor(() => screen.getByText('Welcome, mockUser'));

        const porkFree = screen.getByLabelText('Pork-free');
        const alcoholFree = screen.getByLabelText('Alcohol-free');
        const noneCheckbox = screen.getAllByLabelText('None')[2];

        expect(porkFree).toBeChecked();
        expect(alcoholFree).toBeChecked();

        fireEvent.click(noneCheckbox);

        expect(noneCheckbox).toBeChecked();
        expect(porkFree).not.toBeChecked();
        expect(alcoholFree).not.toBeChecked();
    });

    test('selecting a restriction option unchecks "None"', async () => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                username: 'mockUser',
                dietaryPreferences: [],
                allergies: [],
                restrictions: ['None'],
            }),
        });

        renderWithRouter(<MainPage />);
        await waitFor(() => screen.getByText('Welcome, mockUser'));

        const noneCheckbox = screen.getAllByLabelText('None')[2];
        const glutenFree = screen.getByLabelText('Gluten-free');

        expect(noneCheckbox).toBeChecked();

        fireEvent.click(glutenFree);

        expect(glutenFree).toBeChecked();
        expect(noneCheckbox).not.toBeChecked();
    });
});