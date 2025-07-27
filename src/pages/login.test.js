import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './login';
import { MemoryRouter } from 'react-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

// manually set up spyable navigate mock
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders email and password fields', () => {
        render(<LoginPage />, { wrapper: MemoryRouter });
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
    });

    test('successful login redirects to /home if preferences exist', async () => {
        signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'testUser' },
        });

        getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
            dietaryPreferences: ['High-Protein'],
            allergies: [],
            restrictions: [],
        }),
        });

        render(<LoginPage />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

        await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
        expect(getDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });

    test('successful login redirects to /preferences if no preferences', async () => {
        signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'testUser' },
        });

        getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
            dietaryPreferences: [],
            allergies: [],
            restrictions: [],
        }),
        });

        render(<LoginPage />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

        await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/preferences');
        });
    });

    test('shows alert on login failure', async () => {
        window.alert = jest.fn();
        signInWithEmailAndPassword.mockRejectedValue(new Error('Invalid credentials'));

        render(<LoginPage />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
        fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

        await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Login failed'));
        });
    });

    test('redirects to /preferences with state if user doc does not exist', async () => {
        signInWithEmailAndPassword.mockResolvedValue({
            user: { uid: 'testUser' },
        });

        getDoc.mockResolvedValue({ exists: () => false });

        render(<LoginPage />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/preferences', { state: { from: 'home' } });
        });
    });
});
