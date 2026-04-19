import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Renders an individual Task Card.
 * 
 * Includes expandable descriptions, completion checkboxes, and edit/delete actions.
 * Automatically handles overdue coloring logic.
 *
 * @param {Object} props
 * @param {Object} props.item - The task object data.
 * @param {boolean} props.isExpanded - Whether this card's description area is currently expanded.
 * @param {Function} props.onToggleExpand - Callback to toggle the expanded state.
 * @param {Function} props.onToggleStatus - Callback to mark task as complete/pending.
 * @param {Function} props.onEdit - Callback to open the edit modal for this task.
 * @param {Function} props.onDelete - Callback to delete this task.
 */
export const TaskCard = ({ item, isExpanded, onToggleExpand, onToggleStatus, onEdit, onDelete }) => {
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
    // If no ETA was provided, default to an overdue state so it stands out
    isOverdue = true; 
  }

  // Determine row accent color: Emerald Green normally, Red if pending AND overdue.
  let statusColor = '#10b981';
  if (!item.completed && isOverdue) {
    statusColor = '#ef4444'; 
  }

  return (
    <View style={[styles.taskCard, { borderLeftColor: statusColor }]}>
      <TouchableOpacity 
        style={styles.taskHeader} 
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.taskTitleRow}>
          <TouchableOpacity onPress={onToggleStatus} style={styles.checkboxContainer}>
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

      {/* Expanded Content Area */}
      {isExpanded && (
        <View style={styles.taskDetails}>
          <Text style={styles.taskDescription}>
            {item.description || 'No description provided.'}
          </Text>
          
          <View style={styles.actionButtons}>
            {/* Only allow editing if the task is not yet completed */}
            {!item.completed && (
              <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={onEdit}>
                <Ionicons name="pencil" size={16} color="#6366f1" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
              <Ionicons name="trash" size={16} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#fafaf9',
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
    borderColor: '#c7d2fe',
  },
  editBtnText: {
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteBtn: {
    borderColor: '#fecaca',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 6,
  },
});
