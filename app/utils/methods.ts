import axios from "axios";

export const uploadS3File = async (
  file: File,
  folder: string = "Uploads",
  isVideo: boolean = false
): Promise<string | null> => {
  try {
    // Get JWT token from cookies
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
      return match ? decodeURIComponent(match[2]) : null;
    };
    const token = getCookie("token") || getCookie("authToken") || getCookie("session");

    if (isVideo) {
      // Request presigned URL for video upload to private bucket
      const { data } = await axios.post(
        "/api/upload-video",
        {
          fileName: file.name,
          fileType: file.type,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { uploadURL, fileURL } = data;

      // Upload file using presigned URL
      await axios.put(uploadURL, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      return fileURL; // Returns the S3 key
    } else {
      // Existing logic for public bucket uploads
      const { data } = await axios.post(
        "/api/auth/sign_s3",
        {
          fileName: file.name,
          fileType: file.type,
          folderName: folder,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { uploadURL, fileURL } = data;

      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type.split(";")[0],
        },
      });

      return fileURL;
    }
  } catch (err) {
    console.error("uploadS3File failed:", err);
    return null;
  }
};