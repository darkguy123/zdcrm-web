import crypto from 'crypto';
import axios from 'axios';
import { useLoading } from '@/contexts';

const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const useCloudinary = () => {
  const { setIsUploading, setIsGenerating, setIsDeleting } = useLoading();

  const uploadToCloudinary = async (file: File): Promise<{ id: string; secure_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'zdcrmhub');

    setIsUploading(true);
    try {
      const { data } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      return { id: data?.public_id, secure_url: data?.secure_url };
    } catch (error) {
      throw new Error('Failed to upload file to Cloudinary');
    } finally {
      setIsUploading(false);
    }
  };

  const generateSignature = (publicId: string) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash('sha1')
      .update(signaturePayload)
      .digest('hex');

    return {
      signature,
      timestamp,
    };
  };

  const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    const { signature, timestamp } = generateSignature(publicId);

    setIsDeleting(true);
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          public_id: publicId,
          api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
          timestamp,
          signature,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to delete file from Cloudinary');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    uploadToCloudinary,
    deleteFromCloudinary,
  };
};


export default useCloudinary;