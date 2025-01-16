import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  });
}

export async function uploadFloorPlans(files: File[], jobId: string) {
  // Check environment variables only when the function is called
  if (!process.env.S3_ACCESS_KEY_ID)
    throw new Error("S3_ACCESS_KEY_ID is not set");
  if (!process.env.S3_SECRET_ACCESS_KEY)
    throw new Error("S3_SECRET_ACCESS_KEY is not set");
  if (!process.env.S3_REGION) throw new Error("S3_REGION is not set");
  if (!process.env.S3_BUCKET_NAME) throw new Error("S3_BUCKET_NAME is not set");

  const uploadedUrls: string[] = [];

  try {
    const s3Client = getS3Client(); // Create client only when needed

    // Process each file
    for (const file of files) {
      const fileExtension = file.name.split(".").pop();
      const fileName = `floorplans/job-${jobId}-${Date.now()}.${fileExtension}`;

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      };

      await s3Client.send(new PutObjectCommand(params));
      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
      uploadedUrls.push(fileUrl);
    }

    return uploadedUrls;
  } catch (error: unknown) {
    console.error("Error uploading files to S3:", error);
    // If there's an error, attempt to delete any files that were uploaded
    for (const url of uploadedUrls) {
      try {
        await deleteFloorPlan(url);
      } catch (deleteError) {
        console.error("Error cleaning up after failed upload:", deleteError);
      }
    }
    if (error instanceof Error) {
      throw new Error(`Failed to upload floor plans: ${error.message}`);
    }
    throw new Error("Failed to upload floor plans: Unknown error occurred");
  }
}

export async function deleteFloorPlan(fileUrl: string) {
  if (!process.env.S3_BUCKET_NAME || !fileUrl) return;

  try {
    const s3Client = getS3Client();
    const key = fileUrl.split(`${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/`)[1];
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    }));
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw error;
  }
}

export function validateFile(file: File): boolean {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.');
  }

  // Validate file size (e.g., 5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit.');
  }

  return true;
}

export function validateFiles(files: File[]): boolean {
  for (const file of files) {
    validateFile(file);
  }
  return true;
}

export function getS3Url(fileName: string): string {
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
}

export function getKeyFromUrl(url: string): string {
  return url.split(`${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/`)[1];
}