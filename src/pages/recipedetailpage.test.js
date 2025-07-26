import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipeDetail from './recipedetailpage';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getDoc, getDocs, setDoc, addDoc } from 'firebase/firestore';

jest.mock('react-firebase-hooks/auth');
jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

describe('RecipeDetailPage', () => {
    const mockUser = { uid: 'mockUserId' };
    const mockRecipe = {
        id: 'recipe1',
        imageURL: '',
        servings: 2,
        ingredients: ['Eggs', 'Flour'],
        method: ['Mix', 'Cook'],
        ingredientTags: ['eggs', 'flour'],
        dietTags: ['Vegan'],
        allergyTags: ['Nut'],
        restrictionTags: ['Low-sugar'],
        time: 15
    };
    const mockReview = {
        rating: 5,
        comment: 'Nice recipe!',
        timestamp: { toDate: () => new Date('2023-01-01T12:00:00Z') },
        userId: 'user123'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuthState.mockReturnValue([mockUser, false]);
        getDoc.mockImplementation((ref) => {
            if (ref._key.path.segments.includes('users')) {
                return Promise.resolve({
                    exists: () => true,
                    data: () => ({
                        username: 'testuser',
                        savedRecipes: [],
                        ratedRecipes: []
                    })
                });
            }
            return Promise.resolve({ exists: () => true, data: () => mockRecipe });
        });
        getDocs.mockResolvedValueOnce({
            docs: [
                {
                    data: () => mockReview
                }
            ]
        });
    });

    const renderWithState = (state = {}) => {
        const initialEntry = {
            pathname: '/recipe/recipe1',
            state
        };

        render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/recipe/:id" element={<RecipeDetail />} />
                </Routes>
            </MemoryRouter>
        );
    };

    test('renders loading state initially', () => {
        useAuthState.mockReturnValue([null, true]);
        renderWithState();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('renders recipe details and reviews', async () => {
        renderWithState();
        expect(await screen.findByText('Ingredients (servings: 2)')).toBeInTheDocument();
        expect(screen.getByText('Eggs')).toBeInTheDocument();
        expect(screen.getByText('Mix')).toBeInTheDocument();
        expect(screen.getByText('Nice recipe!')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('saves and unsaves a recipe', async () => {
        getDoc.mockImplementationOnce(() => Promise.resolve({
            exists: () => true,
            data: () => ({ savedRecipes: ['recipe1'] })
        }));
        renderWithState();

        const saveButton = await screen.findByRole('button', { name: /unsave recipe/i });
        fireEvent.click(saveButton);
        await waitFor(() => expect(setDoc).toHaveBeenCalled());
    });

    test('submits a review', async () => {
        renderWithState();
        const commentBox = await screen.findByLabelText(/comment/i);
        const submitButton = screen.getByRole('button', { name: /submit review/i });

        fireEvent.change(commentBox, { target: { value: 'Amazing!' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalled();
            expect(setDoc).toHaveBeenCalled();
        });
    });

    test('renders missing ingredients if some are not selected', async () => {
        renderWithState({ selectedIngredients: ['sugar'] });

        expect(await screen.findByText(/you are missing/i)).toBeInTheDocument();
        expect(screen.getByText('eggs')).toBeInTheDocument();
        expect(screen.getByText('flour')).toBeInTheDocument();
    });

    test('shows message if no ingredients are missing', async () => {
        renderWithState({ selectedIngredients: ['eggs', 'flour'] });
        expect(await screen.findByText("You're not missing anything!")).toBeInTheDocument();
    });

    test('navigates back when back button is clicked', async () => {
        const mockNavigate = jest.fn();
        useNavigate.mockReturnValue(mockNavigate);

        renderWithState({ selectedIngredients: [], filteredRecipes: [], from: '/home' });

        const backButton = await screen.findByText('← Back');
        fireEvent.click(backButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/home', {
            state: {
                selectedIngredients: [],
                filteredRecipes: []
            }
        });
    });

    test('renders Find Stores Near Me button if missing ingredients', async () => {
        renderWithState({ selectedIngredients: ['rice'] });
        expect(await screen.findByText('Find Stores Near Me')).toBeInTheDocument();
    });
});