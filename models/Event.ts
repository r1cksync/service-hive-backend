import mongoose, { Schema, Document, Model } from 'mongoose';

export enum EventStatus {
  BUSY = 'BUSY',
  SWAPPABLE = 'SWAPPABLE',
  SWAP_PENDING = 'SWAP_PENDING',
}

export interface IEvent extends Document {
  title: string;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
  userId: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Please provide a start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please provide an end time'],
      validate: {
        validator: function (this: IEvent, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.BUSY,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
EventSchema.index({ userId: 1, startTime: 1 });
EventSchema.index({ status: 1 });

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
