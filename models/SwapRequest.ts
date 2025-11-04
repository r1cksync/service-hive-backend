import mongoose, { Schema, Document, Model } from 'mongoose';

export enum SwapRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface ISwapRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  requesterSlotId: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  targetSlotId: mongoose.Types.ObjectId;
  status: SwapRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SwapRequestSchema: Schema = new Schema(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterSlotId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetSlotId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SwapRequestStatus),
      default: SwapRequestStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SwapRequestSchema.index({ targetUserId: 1, status: 1 });
SwapRequestSchema.index({ requesterId: 1, status: 1 });

const SwapRequest: Model<ISwapRequest> =
  mongoose.models.SwapRequest || mongoose.model<ISwapRequest>('SwapRequest', SwapRequestSchema);

export default SwapRequest;
