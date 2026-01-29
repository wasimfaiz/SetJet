import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

// Utility: extract user from cookies
async function getUserFromReq(req: Request): Promise<{ userId: string } | null> {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const getCookie = (name: string) => {
      const match = cookieHeader.match(new RegExp("(^|; )" + name + "=([^;]+)"));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const token = getCookie("token") || getCookie("authToken") || getCookie("session");
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const payload = jwt.verify(token, secret) as any;
    const userId = payload?.sub || payload?.userId || payload?.id;
    if (!userId) return null;

    return { userId: String(userId) };
  } catch (err) {
    console.warn("getUserFromReq failed:", (err as Error).message);
    return null;
  }
}

// ---------------- GET APPLICATION ----------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing application ID" }, { status: 400 });

    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("mydatabase");
    const applications = db.collection("applications");

    const appDoc = await applications.findOne({ _id: new ObjectId(id) });
    if (!appDoc) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    
    // Optional ownership check
    if (String(appDoc.userId) !== String(user.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      _id: appDoc._id,
      userId: appDoc.userId,
      serviceName: appDoc.serviceName,
      serviceId: appDoc.serviceId,
      formSubmitted: appDoc.formSubmitted || false,
      formData: appDoc.formData || {},
      metadata: appDoc.metadata || { templateId: 1, selectedColor: "#1E40AF" },
      createdAt: appDoc.createdAt,
      updatedAt: appDoc.updatedAt,
      payment: appDoc.payment || {},
      status: appDoc.status || "PENDING",
    });
  } catch (err) {
    console.error("GET /api/application error:", err);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

// ---------------- UPDATE TEMPLATE / COLOR ----------------
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing application ID" }, { status: 400 });

    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { templateId, selectedColor } = body;

    if (!templateId && !selectedColor) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");
    const applications = db.collection("applications");

    const updateData: any = {};
    if (templateId) updateData["metadata.templateId"] = Number(templateId);
    if (selectedColor) updateData["metadata.selectedColor"] = selectedColor;

    const result = await applications.updateOne(
      { _id: new ObjectId(id), userId: user.userId },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "No changes made" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Application updated successfully" });
  } catch (err) {
    console.error("PUT /api/application error:", err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
