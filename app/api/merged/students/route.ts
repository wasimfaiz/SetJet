// File: app/api/merged/students/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_BASE_URL!;
const LEADS_ENDPOINT = `${BASE}/api/leads/student-leads`;
const DB_ENDPOINT    = `${BASE}/api/database/student-database`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.search;
  const leadCategory = url.searchParams.get("leadCategory");

  try {
    const [leadsRes, dbRes] = await Promise.all([
      fetch(`${LEADS_ENDPOINT}${query}`),
      fetch(`${DB_ENDPOINT}${query}`)
    ]);

    if (!leadsRes.ok) console.error('LEADS fetch failed:', leadsRes.statusText);
    if (!dbRes.ok) console.error('DB fetch failed:', dbRes.statusText);

    const leadsData = await leadsRes.json();
    const dbData = await dbRes.json();

    console.log("Leads data:", leadsData);
    console.log("DB data:", dbData);

    let students = [
      ...(leadsData.students || []),
      ...(dbData.students || [])
    ];

    // Apply leadCategory filter on the server
    if (leadCategory) {
      students = students.filter(student => student.leadCategory === leadCategory);
    }

    students.sort((a, b) => {
      const latestA = Math.max(
        a.to?.assignedAt ? Date.parse(a.to.assignedAt) : 0,
        a.employee?.assignedAt ? Date.parse(a.employee.assignedAt) : 0
      );
      const latestB = Math.max(
        b.to?.assignedAt ? Date.parse(b.to.assignedAt) : 0,
        b.employee?.assignedAt ? Date.parse(b.employee.assignedAt) : 0
      );
      return latestB - latestA;
    });

    const totalCount = students.length; // Correct totalCount calculation
    const totalPages = Math.ceil(totalCount / 20); // Correct totalPages calculation
    const totalStatusCount: Record<string, number> = {};

    // Recalculate totalStatusCount based on filtered students
    students.forEach(student => {
      const status = student.status || "OTHERS"; // Ensure a default status exists
      totalStatusCount[status] = (totalStatusCount[status] || 0) + 1;
    });

    return NextResponse.json({ students, totalCount, totalPages, totalStatusCount });

  } catch (error) {
    console.error('Error fetching or processing student data:', error);
    return NextResponse.json({ error: 'Failed to fetch student data' }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  const bodyJson = await req.json();
  // Accept either 'id' or '_id' in payload
  const id = bodyJson.id || bodyJson._id;
  if (!id) {
    return NextResponse.json({ error: 'Invalid or missing ID' }, { status: 400 });
  }
  const { id: _throwaway, _id, ...rest } = bodyJson;

  const payload = { id, ...rest };
  const payloadText = JSON.stringify(payload);

  // Fire both updates in parallel to fully-qualified URLs
  const [r1, r2] = await Promise.all([
    fetch(`${LEADS_ENDPOINT}?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payloadText,
    }),
    fetch(`${DB_ENDPOINT}?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payloadText,
    }),
  ]);

  const res1 = await r1.text();
  const res2 = await r2.text();
  console.log('✏️  PUT → student-leads:', r1.status, res1);
  console.log('✏️  PUT → student-database:', r2.status, res2);

  // Return success if at least one update succeeded
  if (!r1.ok && !r2.ok) {
    return NextResponse.json(
      {
        success: false,
        studentLeads: { status: r1.status, body: res1 },
        studentDb:    { status: r2.status, body: res2 },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { ids } = await req.json();

  // Delete in both
  await Promise.all([
    fetch(`${LEADS_ENDPOINT}/delete`, { method: 'POST', body: JSON.stringify({ ids }), headers: { 'Content-Type': 'application/json' }}),
    fetch(`${DB_ENDPOINT}/delete`, { method: 'POST', body: JSON.stringify({ ids }), headers: { 'Content-Type': 'application/json' }})
  ]);

  return NextResponse.json({ success: true });
}