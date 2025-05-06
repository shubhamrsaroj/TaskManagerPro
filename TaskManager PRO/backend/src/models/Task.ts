import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  // Recurring task fields
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurringInterval?: number; // For custom intervals (every X days/weeks/months)
  recurringDays?: number[]; // For weekly recurring (0-6, 0 is Sunday)
  recurringDate?: number; // For monthly recurring (1-31)
  recurringEndDate?: Date; // Optional end date for recurring tasks
  parentTaskId?: mongoose.Types.ObjectId; // Reference to the original task if this is a recurring instance
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed'],
      default: 'todo',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Recurring task fields
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
    },
    recurringInterval: {
      type: Number,
      min: 1,
    },
    recurringDays: [{
      type: Number,
      min: 0,
      max: 6,
    }],
    recurringDate: {
      type: Number,
      min: 1,
      max: 31,
    },
    recurringEndDate: {
      type: Date,
    },
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ parentTaskId: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema); 