const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to data directory
const dataDir = path.join(process.cwd(), 'data');

// Function to read JSON file
const readJsonFile = (filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Function to migrate data to Supabase
const migrateData = async () => {
  try {
    console.log('Starting migration...');

    // Migrate badges
    const badges = readJsonFile('badges.json');
    if (badges.length > 0) {
      console.log(`Migrating ${badges.length} badges...`);
      
      // Clear existing badges
      await supabase.from('badges').delete().neq('id', 'placeholder');
      
      // Insert badges
      const { error: badgeError } = await supabase.from('badges').insert(badges);
      if (badgeError) {
        console.error('Error migrating badges:', badgeError);
      } else {
        console.log('Badges migrated successfully');
      }
    }

    // Migrate projects
    const projects = readJsonFile('projects.json');
    if (projects.length > 0) {
      console.log(`Migrating ${projects.length} projects...`);
      
      // Clear existing projects
      await supabase.from('projects').delete().neq('name', 'placeholder');
      
      // Insert projects
      const { error: projectError } = await supabase.from('projects').insert(projects);
      if (projectError) {
        console.error('Error migrating projects:', projectError);
      } else {
        console.log('Projects migrated successfully');
      }
    }

    // Migrate users
    const users = readJsonFile('users.json');
    if (users.length > 0) {
      console.log(`Migrating ${users.length} users...`);
      
      // Clear existing users
      await supabase.from('users').delete().neq('id', 'placeholder');
      
      // Insert users
      const { error: userError } = await supabase.from('users').insert(
        users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.displayName,
          password_hash: user.passwordHash,
          salt: user.salt,
          points: user.points,
          level: user.level,
          badges: user.badges,
          created_at: user.createdAt,
          avatar_url: user.avatarUrl
        }))
      );
      if (userError) {
        console.error('Error migrating users:', userError);
      } else {
        console.log('Users migrated successfully');
      }
    }

    // Migrate comments
    const comments = readJsonFile('comments.json');
    if (comments.length > 0) {
      console.log(`Migrating ${comments.length} comments...`);
      
      // Clear existing comments
      await supabase.from('comments').delete().neq('id', 'placeholder');
      
      // Insert comments
      const { error: commentError } = await supabase.from('comments').insert(
        comments.map(comment => ({
          id: comment.id,
          project_name: comment.projectName,
          user_id: comment.userId,
          text: comment.text,
          parent_id: comment.parentId,
          likes: comment.likes,
          created_at: comment.createdAt,
          updated_at: comment.updatedAt || comment.createdAt,
          edited: comment.edited || false
        }))
      );
      if (commentError) {
        console.error('Error migrating comments:', commentError);
      } else {
        console.log('Comments migrated successfully');
      }
    }

    // Migrate ratings
    const ratings = readJsonFile('ratings.json');
    if (ratings.length > 0) {
      console.log(`Migrating ${ratings.length} ratings...`);
      
      // Clear existing ratings
      await supabase.from('ratings').delete().neq('id', 'placeholder');
      
      // Insert ratings
      const { error: ratingError } = await supabase.from('ratings').insert(
        ratings.map(rating => ({
          id: rating.id,
          project_name: rating.projectName,
          user_id: rating.userId,
          rating: rating.rating,
          review: rating.review,
          created_at: rating.createdAt,
          updated_at: rating.updatedAt
        }))
      );
      if (ratingError) {
        console.error('Error migrating ratings:', ratingError);
      } else {
        console.log('Ratings migrated successfully');
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

migrateData();