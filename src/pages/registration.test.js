import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Registration from './registration';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';

jest.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: jest.fn(),
}));
jest.mock('../firebase');
jest.mock('firebase/firestore', () => ({
    setDoc: jest.fn(),
    doc: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

describe('Registration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.alert = jest.fn();
    });

    test('renders form with all fields', () => {
        render(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );

        expect(screen.getByText(/registration/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    test('handles input changes correctly', () => {
        render(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText(/username/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'securepassword' } });

        expect(usernameInput.value).toBe('testuser');
        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('securepassword');
    });

    test('submits form successfully', async () => {
        const mockUser = { uid: '123' };
        createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
        doc.mockReturnValue({});
        setDoc.mockResolvedValue();

        render(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'tester' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'abc12345' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'abc12345');
            expect(setDoc).toHaveBeenCalled();
            expect(window.alert).toHaveBeenCalledWith('Registered successfully!');
        });
    });

    test('shows error alert on registration failure', async () => {
        const mockError = new Error('Registration failed');
        createUserWithEmailAndPassword.mockRejectedValue(mockError);

        render(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'tester' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'abc12345' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Registration failed');
        });
    });

    test('navigates to homepage on success', async () => {
        const mockNavigate = jest.fn();
        useNavigate.mockReturnValue(mockNavigate);

        const mockUser = { uid: '123' };
        createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
        doc.mockReturnValue({});
        setDoc.mockResolvedValue();

        render(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'tester' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'abc12345' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});