import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostCard from './postcard';
import { useNavigate } from 'react-router';

const mockNavigate = jest.fn();

jest.mock('react-router', () => {
    const actual = jest.requireActual('react-router');
    return {
        ...actual,
        useNavigate: jest.fn(),
    };
});

const mockPost = {
    id: 'abc123',
    caption: 'Test Caption',
    username: 'TestUser',
    imageUrl: 'https://example.com/image.jpg',
    createdAt: {
        toDate: () => new Date('2023-01-01T12:00:00Z'),
    },
    likes: ['user1', 'user2'],
    comments: ['comment1'],
};

beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockImplementation(() => mockNavigate);
});

describe('PostCard Component', () => {
    test('renders caption, author, likes, and comments', () => {
        render(<PostCard post={mockPost} />);
        expect(screen.getByText('Test Caption')).toBeInTheDocument();
        expect(screen.getByText('TestUser')).toBeInTheDocument();
        expect(screen.getByText('❤️ 2')).toBeInTheDocument();
        expect(screen.getByText('💬 1')).toBeInTheDocument();
    });

    test('navigates to post detail page on click', () => {
        render(<PostCard post={mockPost} />);
        fireEvent.click(screen.getByRole('img').closest('.post-card-link'));
        expect(mockNavigate).toHaveBeenCalledWith('/post/abc123');
    });

    test('renders fallback image if image fails to load', () => {
        render(<PostCard post={mockPost} />);
        const img = screen.getByRole('img');
        fireEvent.error(img);
        expect(img.src).toContain('/silly.png');
    });

    test('displays "Just now" if createdAt is missing', () => {
        const post = { ...mockPost, createdAt: null };
        render(<PostCard post={post} />);
        expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    test('handles missing likes/comments gracefully', () => {
        const post = { ...mockPost, likes: null, comments: undefined };
        render(<PostCard post={post} />);
        expect(screen.getByText('❤️ 0')).toBeInTheDocument();
        expect(screen.getByText('💬 0')).toBeInTheDocument();
    });
});
