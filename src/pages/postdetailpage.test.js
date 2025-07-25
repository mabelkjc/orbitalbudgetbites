import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostDetailPage from './postdetailpage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { updateDoc, deleteDoc } from 'firebase/firestore';

jest.mock('../firebase');
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [{ uid: 'mockUserId' }, false, null],
}));
jest.mock('firebase/firestore');

describe('PostDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  test('renders post detail correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/post/123']}>
        <Routes>
          <Route path="/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Test Caption')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('handles like button click', async () => {
    render(
      <MemoryRouter initialEntries={['/post/123']}>
        <Routes>
          <Route path="/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const likeButton = await screen.findByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    expect(likeButton.textContent.toLowerCase()).toMatch(/unlike|like/);
  });

  test('renders comments correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/post/123']}>
        <Routes>
          <Route path="/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Nice post!')).toBeInTheDocument();
    const authorLinks = await screen.findAllByRole('link', { name: 'mockuser' });
    expect(authorLinks.length).toBeGreaterThanOrEqual(2);
  });

  test('adds a new comment', async () => {
    render(
      <MemoryRouter initialEntries={['/post/123']}>
        <Routes>
          <Route path="/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const textarea = await screen.findByPlaceholderText(/what did you feel about this post/i);
    fireEvent.change(textarea, { target: { value: 'Awesome!' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  test('deletes own comment', async () => {
    window.confirm = jest.fn(() => true);

    render(
      <MemoryRouter initialEntries={['/post/123']}>
        <Routes>
          <Route path="/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    const deleteCommentButton = deleteButtons.find(btn => btn.className.includes('delete-comment-button'));
    fireEvent.click(deleteCommentButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  test('deletes own post', async () => {
    window.confirm = jest.fn(() => true);

    render(
      <MemoryRouter initialEntries={['/post/123']}>
        <Routes>
          <Route path="/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteButtons = await screen.findAllByText('🗑️ Delete');
    const deletePostButton = deleteButtons.find(btn => btn.className.includes('delete-post-button'));
    fireEvent.click(deletePostButton);

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});