import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

const COLLECTION_NAME = 'users';

async function findUserById(id: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
}

async function updateUserById(id: string, update: any) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection(COLLECTION_NAME).updateOne({ _id: new ObjectId(id) }, { $set: update });
  return db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
}

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  const { name } = await req.json();

  if (!name) return NextResponse.json({ message: 'Name required' }, { status: 400 });

  const user = await findUserById(userId);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const newApp = { id: nanoid(8), name, steps: [] }; // ID now <10 characters
  const applications = [...(user.applications || []), newApp];
  await updateUserById(userId, { applications });

  return NextResponse.json(newApp, { status: 201 });
}

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const user = await findUserById(params.userId);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  return NextResponse.json(user.applications || []);
}

export async function PUT(req: NextRequest, { params }: { params: { userId: string; appId: string } }) {
  const { userId, appId } = params;
  const { name } = await req.json();
  if (!name) return NextResponse.json({ message: 'Name required' }, { status: 400 });

  const user = await findUserById(userId);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const apps = user.applications || [];
  //@ts-ignore
  const idx = apps.findIndex(a => a.id === appId);
  if (idx === -1) return NextResponse.json({ message: 'Application not found' }, { status: 404 });

  apps[idx].name = name;
  await updateUserById(userId, { applications: apps });
  return NextResponse.json(apps[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string; appId: string } }) {
  const { userId, appId } = params;
  const user = await findUserById(userId);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  //@ts-ignore
  const filtered = (user.applications || []).filter(a => a.id !== appId);
  await updateUserById(userId, { applications: filtered });
  return NextResponse.json({ message: 'Deleted' }, { status: 200 });
}
