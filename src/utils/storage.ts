import { supabase } from './supabase';

/**
 * Loads tasks from Supabase database for the authenticated user.
 * @returns {Promise<Array>} A promise that resolves to an array of task objects.
 */
export const loadTasksFromStorage = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map snake_case from DB to camelCase for the frontend
    return data.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      eta: task.eta,
      completed: task.completed,
      createdAt: task.created_at,
    }));
  } catch (e) {
    console.error('Failed to load tasks from Supabase', e);
    return [];
  }
};

/**
 * Note: saveTasksToStorage is no longer used for bulk saving.
 * Use individual insert/update/delete operations instead.
 */
export const saveTasksToStorage = async (tasks) => {
  console.warn('saveTasksToStorage should be replaced with granular DB operations');
};

/**
 * Inserts a new task into Supabase.
 */
export const insertTask = async (task) => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return null;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      user_id: session.session.user.id,
      title: task.title,
      description: task.description,
      eta: task.eta,
      completed: task.completed,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error inserting task:', error);
    return null;
  }
  
  return {
    ...task,
    id: data.id, // Replace local string ID with true DB UUID
  };
};

/**
 * Updates an existing task in Supabase.
 */
export const updateTask = async (task) => {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: task.title,
      description: task.description,
      eta: task.eta,
      completed: task.completed,
    })
    .eq('id', task.id);

  if (error) console.error('Error updating task:', error);
};

/**
 * Deletes a task from Supabase.
 */
export const deleteTask = async (id) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting task:', error);
};
