import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  createElement
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@tasks_v2'; // changed key to avoid parsing errors with old data structure if any

// Helper for web datetime-local input
const WebDateTimePicker = ({ value, onChange }) => {
  if (Platform.OS === 'web') {
    return createElement('input', {
      type: 'datetime-local',
      value: value ? new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      onChange: (e) => {
        if (e.target.value) {
          onChange(new Date(e.target.value));
        }
      },
      style: {
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '16px',
        width: '100%',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        boxSizing: 'border-box'
      }
    });
  }
  return null;
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
  const [expandedId, setExpandedId] = useState(null);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form states
  const [currentId, setCurrentId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Date Time states
  const [eta, setEta] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  const saveTasks = async (newTasks) => {
    try {
      setTasks(newTasks);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  };

  const openAddModal = () => {
    setTitle('');
    setDescription('');
    
    // Set default ETA to 1 hour from now
    const now = new Date();
    now.setHours(now.getHours() + 1);
    setEta(now);
    
    setIsUpdating(false);
    setCurrentId(null);
    setModalVisible(true);
  };

  const openUpdateModal = (task) => {
    setTitle(task.title);
    setDescription(task.description || '');
    
    if (task.eta) {
      const dateObj = new Date(task.eta);
      if (!isNaN(dateObj.getTime())) {
        setEta(dateObj);
      } else {
        setEta(new Date());
      }
    } else {
      setEta(new Date());
    }
    
    setIsUpdating(true);
    setCurrentId(task.id);
    setModalVisible(true);
  };

  const saveTask = () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    const etaIso = eta ? eta.toISOString() : null;

    if (isUpdating) {
      const newTasks = tasks.map(t => 
        t.id === currentId 
          ? { ...t, title, description, eta: etaIso } 
          : t
      );
      saveTasks(newTasks);
    } else {
      const newTask = {
        id: Date.now().toString(),
        title,
        description,
        eta: etaIso,
        completed: false,
        createdAt: new Date().toISOString()
      };
      saveTasks([...tasks, newTask]);
    }
    setModalVisible(false);
  };

  const removeTask = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this task?')) {
        saveTasks(tasks.filter(t => t.id !== id));
      }
    } else {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => saveTasks(tasks.filter(t => t.id !== id)) }
        ]
      );
    }
  };

  const toggleStatus = (id) => {
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveTasks(newTasks);
  };

  const filteredTasks = tasks.filter(t => 
    activeTab === 'pending' ? !t.completed : t.completed
  ).sort((a, b) => {
    if (!a.eta) return 1;
    if (!b.eta) return -1;
    return new Date(a.eta) - new Date(b.eta);
  });

  const renderTask = ({ item }) => {
    const isExpanded = expandedId === item.id;
    let isOverdue = false;
    let etaFormatted = 'No ETA';

    if (item.eta) {
      const etaDateObj = new Date(item.eta);
      if (!isNaN(etaDateObj.getTime())) {
        isOverdue = new Date() > etaDateObj;
        etaFormatted = etaDateObj.toLocaleString([], {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
      }
    } else {
       isOverdue = true; 
    }

    // Modern light theme colors
    let statusColor = '#10b981'; // Emerald Green
    if (!item.completed && isOverdue) {
      statusColor = '#ef4444'; // Red
    }

    return (
      <View style={[styles.taskCard, { borderLeftColor: statusColor }]}>
        <TouchableOpacity 
          style={styles.taskHeader} 
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.taskTitleRow}>
            <TouchableOpacity onPress={() => toggleStatus(item.id)} style={styles.checkboxContainer}>
              <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                {item.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
            </TouchableOpacity>
            <View style={styles.titleEtaContainer}>
              <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
                {item.title}
              </Text>
              <View style={[styles.etaBadge, { backgroundColor: statusColor + '15' }]}>
                <Ionicons name="time-outline" size={12} color={statusColor} style={{ marginRight: 4 }} />
                <Text style={[styles.taskEta, { color: statusColor }]}>{etaFormatted}</Text>
              </View>
            </View>
          </View>
          <View style={styles.expandIcon}>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#94a3b8" 
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.taskDetails}>
            <Text style={styles.taskDescription}>
              {item.description || 'No description provided.'}
            </Text>
            
            <View style={styles.actionButtons}>
              {!item.completed && (
                <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => openUpdateModal(item)}>
                  <Ionicons name="pencil" size={16} color="#6366f1" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => removeTask(item.id)}>
                <Ionicons name="trash" size={16} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Smart Tasks</Text>
          <Text style={styles.headerSubtitle}>Manage your day effectively</Text>
        </View>
      </View>

      {/* Tabs */}
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

      {/* List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={renderTask}
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

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.9}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isUpdating ? 'Update Task' : 'New Task'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What needs to be done?"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details..."
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>ETA (Date & Time)</Text>
              
              {Platform.OS === 'web' ? (
                <View style={styles.webPickerWrapper}>
                  <WebDateTimePicker value={eta} onChange={setEta} />
                </View>
              ) : (
                <View style={styles.nativePickersRow}>
                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#6366f1" style={{ marginRight: 8 }}/>
                    <Text style={styles.pickerButtonText}>
                      {eta ? eta.toLocaleDateString() : 'Select Date'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color="#6366f1" style={{ marginRight: 8 }}/>
                    <Text style={styles.pickerButtonText}>
                      {eta ? eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={eta}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const newDate = new Date(eta);
                      newDate.setFullYear(selectedDate.getFullYear());
                      newDate.setMonth(selectedDate.getMonth());
                      newDate.setDate(selectedDate.getDate());
                      setEta(newDate);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={eta}
                  mode="time"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(false);
                    if (selectedDate) {
                      const newDate = new Date(eta);
                      newDate.setHours(selectedDate.getHours());
                      newDate.setMinutes(selectedDate.getMinutes());
                      setEta(newDate);
                    }
                  }}
                />
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={saveTask}>
                <Text style={styles.saveBtnText}>{isUpdating ? 'Update Task' : 'Save Task'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Slate-100 Light beautiful background
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
    color: '#6366f1', // Indigo-500
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  taskHeader: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    marginRight: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  titleEtaContainer: {
    flex: 1,
    paddingRight: 10,
  },
  taskTitle: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  taskEta: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandIcon: {
    padding: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
  },
  taskDetails: {
    padding: 16,
    paddingTop: 4,
    backgroundColor: '#fafaf9', // slightly off-white inner
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  taskDescription: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editBtn: {
    borderColor: '#c7d2fe', // light indigo border
  },
  editBtnText: {
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteBtn: {
    borderColor: '#fecaca', // light red border
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1', // Indigo primary
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // transparent slate
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '80%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  formScroll: {
    flex: 1,
  },
  inputLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    color: '#0f172a',
    fontSize: 16,
    marginBottom: 24,
  },
  textArea: {
    minHeight: 120,
  },
  webPickerWrapper: {
    marginBottom: 24,
  },
  nativePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
