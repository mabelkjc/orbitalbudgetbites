import axios from 'axios';

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'web_bb_uploads');

    try {
        const response = await axios.post(
            'https://api.cloudinary.com/v1_1/dgab2ofda/image/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload failed:', error.response?.data || error.message);
        return null;
    }
};

export default uploadToCloudinary;