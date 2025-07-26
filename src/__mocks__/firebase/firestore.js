export const doc = (...segments) => ({
    _key: { path: { segments } },
});
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
export const setDoc = jest.fn();
export const updateDoc = jest.fn();
export const deleteDoc = jest.fn();
export const arrayUnion = jest.fn(comment => comment);
export const getDocs = jest.fn().mockResolvedValue({ docs: [] });
export const collection = jest.fn();
export const query = jest.fn();
export const where = jest.fn();
export const addDoc = jest.fn();
export const orderBy = jest.fn();
export const serverTimestamp = jest.fn();