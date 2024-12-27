import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'data', 'projects.json');
  const data = fs.readFileSync(filePath, 'utf8');
  const projects = JSON.parse(data);
  return NextResponse.json(projects);
}
