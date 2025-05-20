import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import path from 'path';
import fs from 'fs';

// Default projects data to import if no projects exist
const importDefaultProjects = async () => {
  try {
    // Path to default projects JSON file
    const filePath = path.join(process.cwd(), 'data', 'projects.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const projects = JSON.parse(data);
      
      // Insert projects into Supabase
      const { error } = await supabase
        .from('projects')
        .insert(projects);
      
      if (error) {
        console.error("Error importing default projects:", error);
      }
    }
  } catch (error) {
    console.error("Error in importDefaultProjects:", error);
  }
};

// GET: Fetch all projects
export async function GET() {
  try {
    // Check if projects table is empty
    const { data: count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact' });
    
    // If no projects or error, import default data
    if (countError || !count || count.length === 0) {
      await importDefaultProjects();
    }
    
    // Fetch all projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*');
    
    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(projects || []);
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST: Add a new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, stars, forks, tags, url, languages } = body;
    
    // Validate required fields
    if (!name || !description || !url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if project with same name exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('name')
      .eq('name', name)
      .single();
    
    if (existingProject) {
      return NextResponse.json(
        { error: "Project with this name already exists" },
        { status: 400 }
      );
    }
    
    // Insert new project
    const { error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        stars: stars || "0",
        forks: forks || "0",
        tags: tags || [],
        url,
        languages: languages || {}
      });
    
    if (error) {
      console.error("Error adding new project:", error);
      return NextResponse.json(
        { error: "Failed to add project" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing project
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, description, stars, forks, tags, url, languages } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }
    
    // Check if project exists
    const { data: existingProject, error: findError } = await supabase
      .from('projects')
      .select('name')
      .eq('name', name)
      .single();
    
    if (findError || !existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Prepare update object
    const updates: Record<string, any> = {};
    if (description) updates.description = description;
    if (stars) updates.stars = stars;
    if (forks) updates.forks = forks;
    if (tags) updates.tags = tags;
    if (url) updates.url = url;
    if (languages) updates.languages = languages;
    
    // Update project
    const { error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('name', name);
    
    if (updateError) {
      console.error("Error updating project:", updateError);
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/projects:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a project
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("name");
  
  if (!projectName) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }
  
  try {
    // Delete project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('name', projectName);
    
    if (error) {
      console.error("Error deleting project:", error);
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      );
    }
    
    // Also delete related comments and ratings
    await supabase
      .from('comments')
      .delete()
      .eq('project_name', projectName);
    
    await supabase
      .from('ratings')
      .delete()
      .eq('project_name', projectName);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/projects:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}