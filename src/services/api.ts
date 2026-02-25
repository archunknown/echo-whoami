import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type ProfileUpdate = Database['public']['Tables']['profile']['Update'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export async function getProfile() {
    const { data, error } = await supabase
        .from('profile')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }

    return data;
}

export async function updateProfile(id: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
        .from('profile')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }

    return data;
}

export async function getPublishedProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select(`
      *,
      project_technologies (
        is_primary_stack,
        technologies (
          *
        )
      )
    `)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching published projects:', error);
        throw error;
    }

    return data;
}

export async function getAllProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select(`
      *,
      project_technologies (
        is_primary_stack,
        technologies (
          *
        )
      )
    `)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching all projects:', error);
        throw error;
    }

    return data;
}

export async function updateProject(id: string, updates: ProjectUpdate) {
    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating project:', error);
        throw error;
    }

    return data;
}

export async function uploadImage(file: File, bucket: string, path: string) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('Error uploading image:', error);
        throw error;
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
}
