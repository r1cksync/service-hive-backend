import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event, { EventStatus } from '@/models/Event';
import SwapRequest, { SwapRequestStatus } from '@/models/SwapRequest';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';
import { emitSwapRequestAccepted, emitSwapRequestRejected } from '@/lib/socket';

// POST /api/swap-response/[requestId] - Accept or reject a swap request
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const requestId = url.pathname.split('/').pop();

    if (!mongoose.Types.ObjectId.isValid(requestId!)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    const body = await request.json();
    const { accepted } = body;

    if (typeof accepted !== 'boolean') {
      return NextResponse.json(
        { error: 'Please provide accepted as a boolean' },
        { status: 400 }
      );
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the swap request
      const swapRequest = await SwapRequest.findById(requestId).session(session);

      if (!swapRequest) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: 'Swap request not found' }, { status: 404 });
      }

      // Verify the current user is the target user
      if (swapRequest.targetUserId.toString() !== user.userId) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: 'You are not authorized to respond to this swap request' },
          { status: 403 }
        );
      }

      // Verify the swap request is pending
      if (swapRequest.status !== SwapRequestStatus.PENDING) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: 'This swap request has already been processed' },
          { status: 400 }
        );
      }

      // Get both slots
      const requesterSlot = await Event.findById(swapRequest.requesterSlotId).session(session);
      const targetSlot = await Event.findById(swapRequest.targetSlotId).session(session);

      if (!requesterSlot || !targetSlot) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: 'One or both slots not found' }, { status: 404 });
      }

      if (accepted) {
        // ACCEPT: Swap the owners of the two slots
        const tempUserId = requesterSlot.userId;
        requesterSlot.userId = targetSlot.userId;
        targetSlot.userId = tempUserId;

        // Set both slots back to BUSY
        requesterSlot.status = EventStatus.BUSY;
        targetSlot.status = EventStatus.BUSY;

        await requesterSlot.save({ session });
        await targetSlot.save({ session });

        // Update swap request status
        swapRequest.status = SwapRequestStatus.ACCEPTED;
        await swapRequest.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Emit WebSocket notification to requester
        emitSwapRequestAccepted((swapRequest.requesterId as any).toString(), {
          requestId: (swapRequest._id as any).toString(),
          targetSlotTitle: targetSlot.title,
          requesterSlotTitle: requesterSlot.title,
          acceptedAt: new Date().toISOString(),
        });

        return NextResponse.json(
          {
            message: 'Swap request accepted successfully. Slots have been swapped.',
            swapRequest: {
              id: (swapRequest._id as any).toString(),
              status: swapRequest.status,
            },
          },
          { status: 200 }
        );
      } else {
        // REJECT: Set both slots back to SWAPPABLE
        requesterSlot.status = EventStatus.SWAPPABLE;
        targetSlot.status = EventStatus.SWAPPABLE;

        await requesterSlot.save({ session });
        await targetSlot.save({ session });

        // Update swap request status
        swapRequest.status = SwapRequestStatus.REJECTED;
        await swapRequest.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Emit WebSocket notification to requester
        emitSwapRequestRejected((swapRequest.requesterId as any).toString(), {
          requestId: (swapRequest._id as any).toString(),
          targetSlotTitle: targetSlot.title,
          requesterSlotTitle: requesterSlot.title,
          rejectedAt: new Date().toISOString(),
        });

        return NextResponse.json(
          {
            message: 'Swap request rejected. Slots have been set back to SWAPPABLE.',
            swapRequest: {
              id: (swapRequest._id as any).toString(),
              status: swapRequest.status,
            },
          },
          { status: 200 }
        );
      }
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  } catch (error: any) {
    console.error('Swap response error:', error);
    return NextResponse.json(
      { error: 'Failed to process swap response', details: error.message },
      { status: 500 }
    );
  }
});
