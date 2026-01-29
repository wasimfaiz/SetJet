import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "downloaded-file";

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return new Response("Failed to fetch file", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const blob = await response.arrayBuffer();

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": blob.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
