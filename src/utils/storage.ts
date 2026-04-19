import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tasks_v2';

/**
 * Loads tasks from device's local storage.
 * @returns {Promise<Array>} A promise that resolves to an array of task objects.
 */
export const loadTasksFromStorage = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load tasks from local storage', e);
    return [];
  }
};

/**
 * Saves tasks to device's local storage.
 * @param {Array} tasks - The array of task objects to save.
 */
export const saveTasksToStorage = async (tasks) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to local storage', e);
  }
};
