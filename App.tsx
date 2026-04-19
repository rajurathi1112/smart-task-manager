import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';

import { supabase } from './src/utils/supabase';
import { loadTasksFromStorage, insertTask, updateTask, deleteTask } from './src/utils/storage';
import { TaskCard } from './src/components/TaskCard';
import { TaskFormModal } from './src/components/TaskFormModal';
import { AuthScreen } from './src/components/AuthScreen';

/**
 * Main Application Component for Smart Task Manager.
 * Handles the state of the task list, authentication, and orchestrates child components.
 */
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
  const [expandedId, setExpandedId] = useState(null);

  // Modal Visibility State
  const [modalVisible, setModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State passed down to Modal
  const [formData, setFormData] = useState({ title: '', description: '', eta: new Date() });
  
  // Date Picker UI State passed down to Modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      loadTasksFromStorage().then(setTasks);
    } else {
      setTasks([]);
    }
  }, [session]);

  if (!session) {
    return <AuthScreen />;
  }

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  /**
   * Resets the form and opens the modal to create a new task.
   */
  const openAddModal = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Default ETA is 1 hour from now
    
    setFormData({ title: '', description: '', eta: now });
    setIsUpdating(false);
    setCurrentId(null);
    setModalVisible(true);
  };

  /**
   * Populates the form with existing task data and opens the modal to edit.
   */
  const openUpdateModal = (task: any) => {
    let etaDate = new Date();
    if (task.eta) {
      const parsed = new Date(task.eta);
      if (!isNaN(parsed.getTime())) etaDate = parsed;
    }
    
    setFormData({ title: task.title, description: task.description || '', eta: etaDate });
    setIsUpdating(true);
    setCurrentId(task.id);
    setModalVisible(true);
  };

  /**
   * Validates and saves the form data as either a new or updated task.
   */
  const handleSaveTask = async () => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    const etaIso = formData.eta ? formData.eta.toISOString() : null;
    const taskData = {
      title: formData.title,
      description: formData.description,
      eta: etaIso,
      completed: false,
    };

    if (isUpdating) {
      // Optimistic update
      const newTasks = tasks.map(t => 
        t.id === currentId ? { ...t, ...taskData } : t
      );
      setTasks(newTasks);
      
      await updateTask({ id: currentId, ...taskData });
    } else {
      // Create new
      const tempTask = {
        id: Date.now().toString(), // temporary ID
        ...taskData,
        createdAt: new Date().toISOString()
      };
      
      setTasks([...tasks, tempTask]);
      const dbTask = await insertTask(taskData);
      
      // Update with actual DB ID
      if (dbTask) {
        setTasks(currentTasks => currentTasks.map(t => t.id === tempTask.id ? dbTask : t));
      }
    }
    setModalVisible(false);
  };

  /**
   * Prompts user for confirmation and deletes the task if confirmed.
   */
  const handleRemoveTask = (id: string) => {
    const execDelete = () => {
      setTasks(tasks.filter(t => t.id !== id));
      deleteTask(id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this task?')) {
        execDelete();
      }
    } else {
      Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: execDelete }
      ]);
    }
  };

  /**
   * Toggles the completion status of a specific task.
   */
  const toggleStatus = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, completed: newCompleted } : t
    );
    setTasks(newTasks);
    
    updateTask({ ...task, completed: newCompleted });
  };

  const filteredTasks = tasks
    .filter(t => activeTab === 'pending' ? !t.completed : t.completed)
    .sort((a, b) => {
      if (!a.eta) return 1;
      if (!b.eta) return -1;
      return new Date(a.eta).getTime() - new Date(b.eta).getTime();
    });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Smart Tasks</Text>
          <Text style={styles.headerSubtitle}>Manage your day effectively</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]} 
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]} 
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TaskCard 
            item={item} 
            isExpanded={expandedId === item.id}
            onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onToggleStatus={() => toggleStatus(item.id)}
            onEdit={() => openUpdateModal(item)}
            onDelete={() => handleRemoveTask(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="leaf-outline" size={48} color="#6366f1" />
            </View>
            <Text style={styles.emptyStateTitle}>All caught up!</Text>
            <Text style={styles.emptyStateText}>You don't have any tasks here.</Text>
          </View>
        }
      />

      {/* Floating Action Button (Add Task) */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.9}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Task Form Modal Component */}
      <TaskFormModal 
        visible={modalVisible}
        isUpdating={isUpdating}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTask}
        formData={formData}
        setFormData={setFormData}
        pickerState={{ showDatePicker, setShowDatePicker, showTimePicker, setShowTimePicker }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  signOutBtn: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  tabContainerWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#6366f1',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 16,
  },
});
