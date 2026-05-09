import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 * @param file The file object to upload.
 * @param folder The folder in storage (e.g., 'products', 'categories', 'banners').
 * @returns Promise resolving to the download URL.
 */
export const uploadFile = async (file: File, folder: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${timestamp}_${cleanName}`;
    const storageRef = ref(storage, `${folder}/${filename}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Firebase Storage Upload Error:", error);
    throw new Error("Failed to upload image. Please check your storage rules.");
  }
};
