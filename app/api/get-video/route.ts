import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import jwt from "jsonwebtoken";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function extractToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];

  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|; )\s*(?:token|authToken|session)=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return payload?.sub || payload?.userId || payload?.id || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Key required" }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME_PRIVATE!,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return NextResponse.json({ url: signedUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}