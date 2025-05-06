import { Task, ITask } from '../models/Task';
import mongoose from 'mongoose';
import { createNotification } from '../index';

/**
 * Creates a new instance of a recurring task
 */
export const createRecurringTaskInstance = async (parentTask: ITask): Promise<ITask | null> => {
  try {
    // Calculate the due date for the new instance
    const newDueDate = calculateNextDueDate(parentTask);
    
    // If there's an end date and we've passed it, don't create more instances
    if (parentTask.recurringEndDate && newDueDate > parentTask.recurringEndDate) {
      return null;
    }
    
    // Create new task instance
    const newTaskInstance = new Task({
      title: parentTask.title,
      description: parentTask.description,
      dueDate: newDueDate,
      priority: parentTask.priority,
      status: 'todo', // Always start as todo
      assignedTo: parentTask.assignedTo,
      createdBy: parentTask.createdBy,
      isRecurring: false, // Instance isn't recurring itself
      parentTaskId: parentTask._id, // Reference to parent
    });
    
    await newTaskInstance.save();
    
    // Notify the assignee
    if (newTaskInstance.assignedTo.toString() !== newTaskInstance.createdBy.toString()) {
      await createNotification(
        newTaskInstance.assignedTo.toString(),
        `New recurring task: ${newTaskInstance.title}`,
        'task_assigned',
        newTaskInstance._id.toString()
      );
    }
    
    return newTaskInstance;
  } catch (error) {
    console.error('Error creating recurring task instance:', error);
    return null;
  }
};

/**
 * Calculate the next due date based on recurring settings
 */
const calculateNextDueDate = (task: ITask): Date => {
  const currentDueDate = new Date(task.dueDate);
  const newDueDate = new Date(currentDueDate);
  
  switch (task.recurringType) {
    case 'daily':
      // Add days based on interval (default 1)
      newDueDate.setDate(currentDueDate.getDate() + (task.recurringInterval || 1));
      break;
      
    case 'weekly':
      if (task.recurringDays && task.recurringDays.length > 0) {
        // Find the next occurrence based on specified days of week
        const currentDayOfWeek = currentDueDate.getDay();
        const nextDays = task.recurringDays.filter(day => day > currentDayOfWeek);
        
        if (nextDays.length > 0) {
          // Use the next day in the current week
          const daysToAdd = nextDays[0] - currentDayOfWeek;
          newDueDate.setDate(currentDueDate.getDate() + daysToAdd);
        } else {
          // Wrap to the first day in the next week
          const daysToAdd = 7 - currentDayOfWeek + task.recurringDays[0];
          newDueDate.setDate(currentDueDate.getDate() + daysToAdd);
        }
      } else {
        // Simple weekly, add 7 days (or interval * 7)
        newDueDate.setDate(currentDueDate.getDate() + ((task.recurringInterval || 1) * 7));
      }
      break;
      
    case 'monthly':
      if (task.recurringDate) {
        // Set to specific day of month
        const targetMonth = currentDueDate.getMonth() + 1;
        const targetYear = currentDueDate.getFullYear() + (targetMonth > 11 ? 1 : 0);
        const normalizedMonth = targetMonth % 12;
        
        // Create date for the specified day in the next month
        newDueDate.setFullYear(targetYear, normalizedMonth, 1);
        
        // Adjust for months with fewer days
        const daysInMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
        const day = Math.min(task.recurringDate, daysInMonth);
        newDueDate.setDate(day);
      } else {
        // Simple monthly, add interval months
        newDueDate.setMonth(currentDueDate.getMonth() + (task.recurringInterval || 1));
      }
      break;
      
    case 'custom':
      // Add days based on custom interval
      newDueDate.setDate(currentDueDate.getDate() + (task.recurringInterval || 1));
      break;
  }
  
  return newDueDate;
};

/**
 * Process all completed recurring tasks and generate next instances
 * This should be run on a schedule (e.g., daily)
 */
export const processCompletedRecurringTasks = async (): Promise<void> => {
  try {
    // Find all completed recurring tasks
    const completedRecurringTasks = await Task.find({
      isRecurring: true,
      status: 'completed',
    });
    
    for (const task of completedRecurringTasks) {
      await createRecurringTaskInstance(task);
    }
    
    console.log(`Processed ${completedRecurringTasks.length} completed recurring tasks`);
  } catch (error) {
    console.error('Error processing recurring tasks:', error);
  }
};

/**
 * Find all tasks that need to be created based on their recurring pattern
 * This should be run on a schedule (e.g., daily)
 */
export const generateUpcomingRecurringTasks = async (): Promise<void> => {
  try {
    // Get all recurring tasks without a parent (main recurring tasks)
    const recurringTasks = await Task.find({
      isRecurring: true,
      parentTaskId: { $exists: false }
    });
    
    let createdCount = 0;
    
    for (const task of recurringTasks) {
      // Check if a task instance already exists for the next due date
      const nextDueDate = calculateNextDueDate(task);
      
      // Round dates to day precision for comparison (ignore time)
      const nextDueDateDay = new Date(nextDueDate.setHours(0, 0, 0, 0));
      
      // Look for existing instances on the same day
      const startOfDay = new Date(nextDueDateDay);
      const endOfDay = new Date(nextDueDateDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      const existingInstances = await Task.countDocuments({
        parentTaskId: task._id,
        dueDate: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });
      
      // If no instance exists for this date, create one
      if (existingInstances === 0) {
        const newInstance = await createRecurringTaskInstance(task);
        if (newInstance) createdCount++;
      }
    }
    
    console.log(`Created ${createdCount} new recurring task instances`);
  } catch (error) {
    console.error('Error generating upcoming recurring tasks:', error);
  }
}; 