import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipeIndexPage from './recipeindexpage';
import { MemoryRouter } from 'react-router-dom';
import { getDocs } from 'firebase/firestore';

jest.mock('firebase/firestore');

const mockRecipes = [
    { id: '1', name: 'Apple Pie', time: 30, avgRating: 4.2 },
    { id: '2', name: 'Banana Bread', time: 20, avgRating: 4.8 },
    { id: '3', name: 'Carrot Cake', time: 40, avgRating: 4.5 },
];

const renderPage = () => {
    render(
        <MemoryRouter>
            <RecipeIndexPage />
        </MemoryRouter>
    );
};

describe('RecipeIndexPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        getDocs.mockImplementation((ref) => {
            const segments = ref._path?.segments || [];

            if (segments.length === 3 && segments[2] === 'reviews') {
                const recipeId = segments[1];
                const recipe = mockRecipes.find(r => r.id === recipeId);
                return Promise.resolve({
                    docs: recipe ? [{ data: () => ({ rating: recipe.avgRating }) }] : [],
                });
            }

            if (segments.length === 1 && segments[0] === 'Recipes') {
                return Promise.resolve({
                    docs: mockRecipes.map(recipe => ({
                        id: recipe.id,
                        data: () => ({
                            name: recipe.name,
                            time: recipe.time,
                        }),
                    })),
                });
            }

            return Promise.resolve({ docs: [] });
        });
    });

    test('renders and shows recipes', async () => {
        renderPage();
        for (const recipe of mockRecipes) {
            expect(await screen.findByText(recipe.name)).toBeInTheDocument();
        }
    });

    test('clears search input and resets list', async () => {
        renderPage();
        const input = await screen.findByPlaceholderText(/search recipes/i);
        fireEvent.change(input, { target: { value: 'Pie' } });

        const clearButton = await screen.findByText('×');
        fireEvent.click(clearButton);

        expect(input.value).toBe('');
        expect(await screen.findByText('Banana Bread')).toBeInTheDocument();
    });

    test('persists search term in localStorage and filters correctly', async () => {
        localStorage.setItem('searchTerm', 'Banana');
        renderPage();

        expect(await screen.findByText('Banana Bread')).toBeInTheDocument();
        expect(screen.queryByText('Apple Pie')).not.toBeInTheDocument();
    });

    test('sorts recipes by A to Z', async () => {
        renderPage();
        fireEvent.click(await screen.findByText(/top rated/i));
        fireEvent.click(screen.getByText(/a to z/i));

        await waitFor(() => {
            const titles = screen.getAllByText(/.+/)
                .filter(el => el.className.includes('recipe-card-name'))
                .map(el => el.textContent);

            expect(titles).toEqual(['Apple Pie', 'Banana Bread', 'Carrot Cake']);
        });
    });

    test('sorts recipes by Top Rated', async () => {
        renderPage();
        fireEvent.click(await screen.findByText(/top rated/i));
        fireEvent.click(screen.getAllByText(/top rated/i)[1]);

        await waitFor(() => {
            const titles = screen.getAllByText(/.+/)
                .filter(el => el.className.includes('recipe-card-name'))
                .map(el => el.textContent);
            expect(titles[0]).toBe('Banana Bread');
        });
    });

    test('sorts recipes by Shortest Time', async () => {
        renderPage();
        fireEvent.click(await screen.findByText(/top rated/i));
        fireEvent.click(screen.getByText(/shortest time/i));

        await waitFor(() => {
            const titles = screen.getAllByText(/.+/)
                .filter(el => el.className.includes('recipe-card-name'))
                .map(el => el.textContent);
            expect(titles[0]).toBe('Banana Bread');
        });
    });

    test('shows "No recipes found" when nothing matches search', async () => {
        renderPage();
        const input = await screen.findByPlaceholderText(/search recipes/i);
        fireEvent.change(input, { target: { value: 'xyz' } });
        fireEvent.click(screen.getByText('⌕'));

        expect(await screen.findByText(/no recipes found/i)).toBeInTheDocument();
    });

    test('displays and selects from suggestion list', async () => {
        renderPage();
        const input = await screen.findByPlaceholderText(/search recipes/i);
        fireEvent.change(input, { target: { value: 'Apple Pie' } });

        await waitFor(() => {
            expect(screen.getByText('Apple Pie')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Apple Pie'));
        await waitFor(() => {
            expect(input.value).toBe('Apple Pie');
        });
    });
});