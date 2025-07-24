jest.mock('react-firebase-hooks/auth', () => ({
    useAuthState: jest.fn(),
}));

import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommunityPage from './community';
import { useAuthState } from 'react-firebase-hooks/auth';
import uploadToCloudinary from '../cloudinaryUpload';
import {
    collection,
    getDocs,
    addDoc,
    getDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

jest.mock('../cloudinaryUpload', () => jest.fn());
jest.mock('../firebase', () => ({
    auth: {},
    db: {},
}));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'collectionRef'),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    getDoc: jest.fn(),
    doc: jest.fn(() => 'docRef'),
    query: jest.fn(() => 'queryRef'),
    orderBy: jest.fn(() => 'orderByRef'),
    serverTimestamp: jest.fn(() => 'timestamp'),
}));
jest.mock('../components/navbar', () => () => <div data-testid="navbar">Mock Navbar</div>);
jest.mock('../components/postcard', () => ({ post }) => (
    <div data-testid="postcard">{post.caption}</div>
));

beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'mocked-url');
});

beforeEach(() => {
    jest.clearAllMocks();
    useAuthState.mockReturnValue([{ uid: 'user123', email: 'test@example.com' }, false, null]);
});

test('loads and displays posts', async () => {
    getDocs.mockResolvedValueOnce({
        docs: [{ id: '1', data: () => ({ caption: 'Yummy Food' }) }],
    });

    await act(async () => {
        render(<CommunityPage />);
    });

    await waitFor(() => {
        expect(screen.getByTestId('postcard')).toBeInTheDocument();
        expect(screen.getByText('Yummy Food')).toBeInTheDocument();
    });
});

test('shows fallback message if no posts', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });

    await act(async () => {
        render(<CommunityPage />);
    });

    await waitFor(() => {
        expect(screen.getByText('There are no posts found.')).toBeInTheDocument();
    });
});

test('handles image preview and cancellation', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });


    const mockUrl = 'blob:http://localhost/preview';
    global.URL.createObjectURL = jest.fn(() => mockUrl);

    await act(async () => {
        render(<CommunityPage />);
    });

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload your image/i);


    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });


    const previewImg = await screen.findByAltText('Preview');
    expect(previewImg).toBeInTheDocument();
    expect(previewImg.src).toBe(mockUrl);


    fireEvent.click(screen.getByText('✖'));


    await waitFor(() => {
        expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    });
});

test('clears form when Clear button clicked', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });

    await act(async () => {
        render(<CommunityPage />);
    });

    fireEvent.change(await screen.findByPlaceholderText('Title your post'), {
        target: { value: 'My caption' },
    });
    fireEvent.change(screen.getByPlaceholderText(/write about/i), {
        target: { value: 'My description' },
    });

    fireEvent.click(screen.getByText('Clear'));

    expect(screen.getByPlaceholderText('Title your post')).toHaveValue('');
    expect(screen.getByPlaceholderText(/write about/i)).toHaveValue('');
});

test('alerts when submitting with no image', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    window.alert = jest.fn();

    await act(async () => {
        render(<CommunityPage />);
    });

    fireEvent.click(await screen.findByText('Submit'));
    expect(window.alert).toHaveBeenCalledWith('Please upload an image.');
});

test('submits post and refreshes posts', async () => {
    uploadToCloudinary.mockResolvedValue('https://mockedimage.com/image.jpg');
    getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ username: 'TestUser', profilePicture: '/pic.png' }),
    });
    getDocs
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [{ id: '1', data: () => ({ caption: 'Posted!' }) }] });

    await act(async () => {
        render(<CommunityPage />);
    });

    const file = new File(['img'], 'food.png', { type: 'image/png' });

    await act(async () => {
        fireEvent.change(await screen.findByLabelText(/upload your image/i), {
        target: { files: [file] },
        });
    });

    fireEvent.change(await screen.findByPlaceholderText('Title your post'), {
        target: { value: 'Posted!' },
    });

    fireEvent.click(await screen.findByText('Submit'));

    await waitFor(() => {
        expect(uploadToCloudinary).toHaveBeenCalled();
        expect(addDoc).toHaveBeenCalled();
        expect(screen.getByText('Posted!')).toBeInTheDocument();
    });
});

test('shows loading state before posts load', async () => {
    let resolveGetDocs;
    getDocs.mockImplementation(
        () => new Promise(resolve => (resolveGetDocs = resolve))
    );
    render(<CommunityPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await act(async () => {
        resolveGetDocs({ docs: [] });
    });
});

test('loads more posts on button click', async () => {
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        data: () => ({ caption: `Post ${i}` }),
    }));
    getDocs.mockResolvedValueOnce({ docs: mockPosts });

    await act(async () => {
        render(<CommunityPage />);
    });

    expect(screen.queryByText('Post 6')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Load more posts'));
    expect(await screen.findByText('Post 6')).toBeInTheDocument();
});

test('handles Firestore fetch failure gracefully', async () => {
    const error = new Error('Firestore error');
    getDocs.mockRejectedValueOnce(error);
    await act(async () => {
        render(<CommunityPage />);
    });
    expect(screen.queryByText('There are no posts found.')).toBeInTheDocument();
});

test('handles user profile fetch failure on submit', async () => {
    uploadToCloudinary.mockResolvedValue('https://mockedimage.com/image.jpg');
    getDoc.mockRejectedValueOnce(new Error('Profile error'));
    getDocs
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [{ id: '1', data: () => ({ caption: 'Posted!' }) }] });

    await act(async () => {
        render(<CommunityPage />);
    });

    const file = new File(['img'], 'food.png', { type: 'image/png' });
    await act(async () => {
        fireEvent.change(await screen.findByLabelText(/upload your image/i), {
        target: { files: [file] },
        });
    });
    fireEvent.change(screen.getByPlaceholderText('Title your post'), {
        target: { value: 'Posted!' },
    });
    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Posted!')).toBeInTheDocument();
});

test('renders safely with null user', async () => {
    useAuthState.mockReturnValue([null, false, null]);
    getDocs.mockResolvedValueOnce({ docs: [] });
    render(<CommunityPage />);
    expect(await screen.findByText('There are no posts found.')).toBeInTheDocument();
});

test('ignores preview for invalid file type', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    const badFile = new File(['not-an-image'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
        render(<CommunityPage />);
    });

    await act(async () => {
        fireEvent.change(screen.getByLabelText(/upload your image/i), {
        target: { files: [badFile] },
        });
    });

    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
});
