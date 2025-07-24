import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipeCard from './recipecard';
import { collection, getDocs, doc } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn(),
}));

jest.mock('../firebase', () => ({
    db: {},
}));

const mockNavigate = jest.fn();
jest.mock('react-router', () => {
    const actual = jest.requireActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockRecipe = {
    id: 'recipe123',
    name: 'Test Recipe',
    time: 30,
};

describe('RecipeCard Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders recipe name, time, and default star ratings', async () => {
        getDocs.mockResolvedValue({
        docs: [
            { data: () => ({ rating: 4 }) },
            { data: () => ({ rating: 5 }) },
        ],
        });

        render(
        <RecipeCard
            recipe={mockRecipe}
            selectedIngredients={['egg']}
            filteredRecipes={[]}
            fromPage="/home"
        />
        );

        await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
        expect(screen.getByText('⏱️ 30 min')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument(); // avg of 4 and 5
        expect(screen.getByText((text) => text.includes('★★★★'))).toBeInTheDocument();
        });
    });

    test('navigates with state on click', async () => {
        getDocs.mockResolvedValue({ docs: [] });

        render(
        <RecipeCard
            recipe={mockRecipe}
            selectedIngredients={['egg']}
            filteredRecipes={['someRecipe']}
            fromPage="/recipeindex"
        />
        );

        fireEvent.click(screen.getByRole('img'));
        await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/recipe/recipe123', {
            state: {
            selectedIngredients: ['egg'],
            filteredRecipes: ['someRecipe'],
            from: '/recipeindex',
            },
        });
        });
    });

    test('renders fallback text and stars when no ratings found', async () => {
        getDocs.mockResolvedValue({ docs: [] });

        render(
        <RecipeCard
            recipe={{ ...mockRecipe, name: undefined }}
            selectedIngredients={[]}
            filteredRecipes={[]}
        />
        );

        await waitFor(() => {
        expect(screen.getByText('recipe123')).toBeInTheDocument(); // fallback to id
        expect(screen.getByText('No reviews')).toBeInTheDocument();
        expect(screen.getByText('☆☆☆☆☆')).toBeInTheDocument(); // zero stars
        });
    });

    test('renders N/A if time is missing', async () => {
        getDocs.mockResolvedValue({ docs: [] });

        render(
        <RecipeCard
            recipe={{ ...mockRecipe, time: undefined }}
            selectedIngredients={[]}
            filteredRecipes={[]}
        />
        );

        await waitFor(() => {
        expect(screen.getByText('⏱️ N/A min')).toBeInTheDocument();
        });
    });

    test('uses fallback image if image fails to load', async () => {
        getDocs.mockResolvedValue({ docs: [] });

        render(
        <RecipeCard
            recipe={mockRecipe}
            selectedIngredients={[]}
            filteredRecipes={[]}
        />
        );

        const img = screen.getByRole('img');
        fireEvent.error(img);
        expect(img.src).toContain('/silly.png');
    });

    test('handles invalid rating values gracefully', async () => {
        getDocs.mockResolvedValue({
        docs: [
            { data: () => ({ rating: 'bad' }) },
            { data: () => ({ rating: null }) },
        ],
        });

        render(
        <RecipeCard
            recipe={mockRecipe}
            selectedIngredients={[]}
            filteredRecipes={[]}
        />
        );

        await waitFor(() => {
        expect(screen.getByText('No reviews')).toBeInTheDocument();
        });
    });

    test('handles Firestore error gracefully', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        getDocs.mockRejectedValue(new Error('Firestore failure'));

        render(
        <RecipeCard
            recipe={mockRecipe}
            selectedIngredients={[]}
            filteredRecipes={[]}
        />
        );

        await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith('Error fetching ratings:', expect.any(Error));
        });

        errorSpy.mockRestore();
    });
});

