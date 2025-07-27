import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from './home';
import { MemoryRouter } from 'react-router';
import { getDocs, collection } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
    getDocs: jest.fn(),
    collection: jest.fn(),
}));

jest.mock('../firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'testUser' } },
}));

jest.mock('../components/navbar', () => () => <div data-testid="navbar">Mock Navbar</div>);
jest.mock('../components/recipecard', () => ({ recipe }) => (
    <div>{recipe.name}</div>
));

describe('HomePage', () => {
    const usersRef = { id: 'users' };
    const recipesRef = { id: 'recipes' };

    beforeEach(() => {
        jest.clearAllMocks();

        collection.mockImplementation((db, name) => {
        if (name === 'users') return usersRef;
        if (name === 'Recipes') return recipesRef;
        return {};
        });

        getDocs.mockImplementation((ref) => {
        if (ref === usersRef) {
            return Promise.resolve({
            forEach: (cb) => cb({
                id: 'testUser',
                data: () => ({
                allergies: ['Pork'],
                restrictions: ['Halal'],
                dietaryPreferences: ['High-Protein'],
                }),
            }),
            });
        }

        if (ref === recipesRef) {
            return Promise.resolve({
            docs: [
                {
                id: 'r1',
                data: () => ({
                    name: 'Chicken Rice',
                    ingredientTags: ['Chicken', 'Rice'],
                    allergyTags: [],
                    restrictionTags: ['halal'],
                    dietTags: ['high-protein'],
                }),
                },
                {
                id: 'r2',
                data: () => ({
                    name: 'Pork Ramen',
                    ingredientTags: ['Pork', 'Ramen'],
                    allergyTags: ['pork'],
                    restrictionTags: ['non-halal'],
                    dietTags: [],
                }),
                },
            ],
            });
        }

        return Promise.resolve({ docs: [] });
        });
    });

    test('filters recipes based on profile and ingredient', async () => {
        render(<HomePage />, { wrapper: MemoryRouter });

        await screen.findByText('Chicken Rice');

        fireEvent.click(screen.getByText('Update & Search'));

        await waitFor(() => {
        expect(screen.getByText('Chicken Rice')).toBeInTheDocument();
        expect(screen.queryByText('Pork Ramen')).not.toBeInTheDocument();
        expect(screen.getByText(/based on your profile/i)).toBeInTheDocument();
        });
    });

    test('clears all filters and resets recipe list', async () => {
        render(<HomePage />, { wrapper: MemoryRouter });

        await screen.findByText('Chicken Rice');

        fireEvent.click(screen.getByText('Clear All'));

        await waitFor(() => {
        expect(screen.getByText('Chicken Rice')).toBeInTheDocument();
        expect(screen.getByText('Pork Ramen')).toBeInTheDocument();
        });
    });

    test('filters based on profile only (no ingredients)', async () => {
        render(<HomePage />, { wrapper: MemoryRouter });

        await screen.findByText('Chicken Rice');

        fireEvent.click(screen.getByText('Update & Search'));

        await waitFor(() => {
        expect(screen.getByText('Chicken Rice')).toBeInTheDocument();
        expect(screen.queryByText('Pork Ramen')).not.toBeInTheDocument();
        expect(screen.getByText(/based on your profile/i)).toBeInTheDocument();
        });
    });

    test('shows message when no recipes match filters', async () => {
        render(<HomePage />, { wrapper: MemoryRouter });

        await screen.findByText('Chicken Rice');

        const checkbox = screen.getByLabelText('Avocado');
        fireEvent.click(checkbox);

        fireEvent.click(screen.getByText('Update & Search'));

        await waitFor(() => {
        expect(screen.queryByText('Chicken Rice')).not.toBeInTheDocument();
        expect(screen.queryByText('Pork Ramen')).not.toBeInTheDocument();
        expect(screen.getByText('No recipes match your filters.')).toBeInTheDocument();
        });
    });
});

