import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type ProfileUpdate = Database['public']['Tables']['profile']['Update'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type CertificationUpdate = Database['public']['Tables']['certifications']['Update'];
type CertificationInsert = Database['public']['Tables']['certifications']['Insert'];
type TechnologyUpdate = Database['public']['Tables']['technologies']['Update'];
type TechnologyInsert = Database['public']['Tables']['technologies']['Insert'];
type ContactMessageInsert = Database['public']['Tables']['contact_messages']['Insert'];

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

export async function createProject(project: ProjectInsert) {
    const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

    if (error) {
        console.error('Error creating project:', error);
        throw error;
    }

    return data;
}

export async function deleteProject(id: string) {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}

export async function getAllTechnologies() {
    const { data, error } = await supabase
        .from('technologies')
        .select('*')
        .order('category', { ascending: true });

    if (error) {
        console.error('Error fetching all technologies:', error);
        throw error;
    }

    return data;
}

export async function createTechnology(tech: TechnologyInsert) {
    const { data, error } = await supabase
        .from('technologies')
        .insert(tech)
        .select()
        .single();

    if (error) {
        console.error('Error creating technology:', error);
        throw error;
    }

    return data;
}

export async function updateTechnology(id: string, updates: TechnologyUpdate) {
    const { data, error } = await supabase
        .from('technologies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating technology:', error);
        throw error;
    }

    return data;
}

export async function deleteTechnology(id: string) {
    const { error } = await supabase
        .from('technologies')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting technology:', error);
        throw error;
    }
}

export async function getAllCertifications() {
    const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching all certifications:', error);
        throw error;
    }

    return data;
}

export async function getPublishedCertifications() {
    const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching published certifications:', error);
        throw error;
    }

    return data;
}

export async function createCertification(certification: CertificationInsert) {
    const { data, error } = await supabase
        .from('certifications')
        .insert(certification)
        .select()
        .single();

    if (error) {
        console.error('Error creating certification:', error);
        throw error;
    }

    return data;
}

export async function updateCertification(id: string, updates: CertificationUpdate) {
    const { data, error } = await supabase
        .from('certifications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating certification:', error);
        throw error;
    }

    return data;
}

export async function deleteCertification(id: string) {
    const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting certification:', error);
        throw error;
    }
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

export async function submitContactMessage(message: ContactMessageInsert) {
    const { data, error } = await supabase
        .from('contact_messages')
        .insert(message)
        .select()
        .single();

    if (error) {
        console.error('Error submitting contact message:', error);
        throw error;
    }

    return data;
}

export async function getContactMessages() {
    const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contact messages:', error);
        throw error;
    }

    return data;
}

export async function deleteContactMessage(id: string) {
    const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting contact message:', error);
        throw error;
    }
}
