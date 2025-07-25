export const doc = jest.fn();
export const getDoc = jest.fn().mockResolvedValue({
  exists: () => true,
  data: () => ({
    caption: 'Test Caption',
    description: 'Test Description',
    userId: 'mockUserId',
    username: 'mockuser',
    imageUrl: '/test-image.jpg',
    likes: [],
    comments: [
      {
        text: 'Nice post!',
        userId: 'mockUserId',
        username: 'mockuser',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: { toDate: () => new Date() },
    profilePicture: '/avatars/default-profile.png',
  }),
});
export const updateDoc = jest.fn();
export const deleteDoc = jest.fn();
export const arrayUnion = jest.fn(comment => comment);