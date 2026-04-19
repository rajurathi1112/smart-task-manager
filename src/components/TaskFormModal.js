import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebDateTimePicker } from './WebDateTimePicker';

/**
 * A Modal Form for adding or updating a task.
 * 
 * Handles Title, Description, and Date/Time inputs safely across iOS, Android, and Web.
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is currently visible.
 * @param {boolean} props.isUpdating - Whether this modal is updating an existing task (vs creating a new one).
 * @param {Function} props.onClose - Callback fired when closing the modal.
 * @param {Function} props.onSave - Callback fired with the saved task data.
 * @param {Object} props.formData - The current form state `{title, description, eta}`.
 * @param {Function} props.setFormData - State setter for form data.
 * @param {Object} props.pickerState - State to manage native Date/Time pickers.
 */
export const TaskFormModal = ({
  visible,
  isUpdating,
  onClose,
  onSave,
  formData,
  setFormData,
  pickerState
}) => {
  const { title, description, eta } = formData;
  const { showDatePicker, setShowDatePicker, showTimePicker, setShowTimePicker } = pickerState;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isUpdating ? 'Update Task' : 'New Task'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            {/* Title Input */}
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={(val) => setFormData(prev => ({...prev, title: val}))}
            />

            {/* Description Input */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={(val) => setFormData(prev => ({...prev, description: val}))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Date/Time Picker */}
            <Text style={styles.inputLabel}>ETA (Date & Time)</Text>
            
            {/* Web fallback for Date/Time picker using HTML5 */}
            {Platform.OS === 'web' ? (
              <View style={styles.webPickerWrapper}>
                <WebDateTimePicker 
                  value={eta} 
                  onChange={(newDate) => setFormData(prev => ({...prev, eta: newDate}))} 
                />
              </View>
            ) : (
              // Native iOS/Android Date/Time buttons that trigger the DateTimePicker
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

            {/* Actual Native Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={eta || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const newDate = new Date(eta || new Date());
                    newDate.setFullYear(selectedDate.getFullYear());
                    newDate.setMonth(selectedDate.getMonth());
                    newDate.setDate(selectedDate.getDate());
                    setFormData(prev => ({...prev, eta: newDate}));
                  }
                }}
              />
            )}

            {/* Actual Native Time Picker */}
            {showTimePicker && (
              <DateTimePicker
                value={eta || new Date()}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowTimePicker(false);
                  if (selectedDate) {
                    const newDate = new Date(eta || new Date());
                    newDate.setHours(selectedDate.getHours());
                    newDate.setMinutes(selectedDate.getMinutes());
                    setFormData(prev => ({...prev, eta: newDate}));
                  }
                }}
              />
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveBtnText}>{isUpdating ? 'Update Task' : 'Save Task'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
