import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// Handle GET requests to fetch all blogs or a specific blog by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("blogs");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const onlyPublished = url.searchParams.get("published"); // optional ?published=true

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      const blog = await collection.findOne({ _id: new ObjectId(id) });

      if (!blog) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }

      return NextResponse.json(blog);
    } else {
      const filter: Record<string, any> = {};
      // If you call /api/blogs?published=true, only return published ones
      if (onlyPublished === "true") {
        filter.publish = true;
      }

      const items = await collection.find(filter).toArray();
      return NextResponse.json(items);
    }
  } catch (e) {
    console.error(e);
    return NextResponse.error();
  }
}

// Handle POST requests to create a new blog post
// POST: create new blog (with optional scheduledAt)
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("blogs");

    const data = await request.json();

    const {
      title,
      metaDesc,
      category,
      desc,
      content,
      author,
      date,
      picture,
      publish,
      scheduledAt,
    } = data;

    if (
      !title ||
      !content ||
      !author ||
      !date ||
      !picture ||
      !metaDesc ||
      !category ||
      !desc
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    let publishFlag = publish === true;
    let scheduledDate: Date | null = null;

    if (scheduledAt) {
      const d = new Date(scheduledAt); // scheduledAt is ISO string from frontend
      if (!isNaN(d.getTime())) {
        // Always store as Date so cron can compare
        scheduledDate = d;
        // If in the future, keep unpublished until cron runs; if in past, publish immediately
        if (d > now) {
          publishFlag = false;
        } else {
          publishFlag = true;
        }
      }
    }

    const newBlog = {
      title,
      metaDesc,
      category,
      desc,
      content,
      author,
      date,
      picture,
      publish: publishFlag,
      scheduledAt: scheduledDate,
    };

    const result = await collection.insertOne(newBlog);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.error();
  }
}


// Handle PUT requests to update a blog by ID
// PUT: update blog by ID (including scheduling fields)
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("blogs");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const data = await request.json();
    const {
      title,
      metaDesc,
      category,
      desc,
      content,
      author,
      date,
      picture,
      publish,
      scheduledAt,
    } = data;

    const updatedBlog: { [key: string]: any } = {};
    if (title !== undefined) updatedBlog.title = title;
    if (metaDesc !== undefined) updatedBlog.metaDesc = metaDesc;
    if (category !== undefined) updatedBlog.category = category;
    if (desc !== undefined) updatedBlog.desc = desc;
    if (content !== undefined) updatedBlog.content = content;
    if (author !== undefined) updatedBlog.author = author;
    if (date !== undefined) updatedBlog.date = date;
    if (picture !== undefined) updatedBlog.picture = picture;

    // 1) Handle scheduledAt: just store/clear it as Date, don't decide publish here
    if (scheduledAt !== undefined) {
      if (!scheduledAt) {
        updatedBlog.scheduledAt = null;
      } else {
        const d = new Date(scheduledAt);
        if (!isNaN(d.getTime())) {
          updatedBlog.scheduledAt = d;
        }
      }
    }

    // 2) Always respect explicit publish from payload
    if (publish !== undefined) {
      updatedBlog.publish = !!publish;
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedBlog }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No document found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Blog updated successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.error();
  }
}


// Handle DELETE requests to delete a blog by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("blogs");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No document found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Blog deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.error();
  }
}
