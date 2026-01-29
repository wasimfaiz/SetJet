import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { fileName, fileType, folderName } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure folder has no trailing slash
    const folder = folderName ? folderName.replace(/\/+$/, "") : "misc";

    // Generate unique name
    const uniqueFileName = `${nanoid()}_${fileName}`;
    const key = `${folder}/${uniqueFileName}`;

    // Clean file type (remove charset etc.)
    const cleanFileType = fileType.split(";")[0];

    // Create pre-signed PUT command (disable checksum signing by not including ChecksumAlgorithm)
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: cleanFileType,
    });

    const uploadURL = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    const fileURL = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ uploadURL, fileURL });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Error generating signed URL" },
      { status: 500 }
    );
  }
}
