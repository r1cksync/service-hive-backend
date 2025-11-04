import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event, { EventStatus } from '@/models/Event';
import SwapRequest, { SwapRequestStatus } from '@/models/SwapRequest';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';
import { emitSwapRequestCreated } from '@/lib/socket';

// POST /api/swap-request - Create a new swap request
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const body = await request.json();
    const { mySlotId, theirSlotId } = body;

    // Validation
    if (!mySlotId || !theirSlotId) {
      return NextResponse.json(
        { error: 'Please provide both mySlotId and theirSlotId' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(mySlotId) || !mongoose.Types.ObjectId.isValid(theirSlotId)) {
      return NextResponse.json({ error: 'Invalid slot IDs' }, { status: 400 });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify my slot exists and belongs to the requester
      const mySlot = await Event.findOne({
        _id: mySlotId,
        userId: user.userId,
      }).session(session);

      if (!mySlot) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: 'Your slot not found or does not belong to you' },
          { status: 404 }
        );
      }

      // Verify my slot is SWAPPABLE
      if (mySlot.status !== EventStatus.SWAPPABLE) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: 'Your slot must be SWAPPABLE to create a swap request' },
          { status: 400 }
        );
      }

      // Verify their slot exists
      const theirSlot = await Event.findById(theirSlotId).session(session);

      if (!theirSlot) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: 'Target slot not found' }, { status: 404 });
      }

      // Verify their slot is SWAPPABLE
      if (theirSlot.status !== EventStatus.SWAPPABLE) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: 'Target slot must be SWAPPABLE' },
          { status: 400 }
        );
      }

      // Verify it's not the same user
      if (theirSlot.userId.toString() === user.userId) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: 'Cannot swap with your own slot' },
          { status: 400 }
        );
      }

      // Check for existing pending swap requests involving these slots
      const existingRequest = await SwapRequest.findOne({
        $or: [
          { requesterSlotId: mySlotId, status: SwapRequestStatus.PENDING },
          { targetSlotId: mySlotId, status: SwapRequestStatus.PENDING },
          { requesterSlotId: theirSlotId, status: SwapRequestStatus.PENDING },
          { targetSlotId: theirSlotId, status: SwapRequestStatus.PENDING },
        ],
      }).session(session);

      if (existingRequest) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: 'One or both slots are already involved in a pending swap request' },
          { status: 409 }
        );
      }

      // Create swap request
      const swapRequest = await SwapRequest.create(
        [
          {
            requesterId: new mongoose.Types.ObjectId(user.userId),
            requesterSlotId: new mongoose.Types.ObjectId(mySlotId),
            targetUserId: theirSlot.userId,
            targetSlotId: new mongoose.Types.ObjectId(theirSlotId),
            status: SwapRequestStatus.PENDING,
          },
        ],
        { session }
      );

      // Update both slots to SWAP_PENDING
      await Event.findByIdAndUpdate(
        mySlotId,
        { status: EventStatus.SWAP_PENDING },
        { session }
      );

      await Event.findByIdAndUpdate(
        theirSlotId,
        { status: EventStatus.SWAP_PENDING },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // Emit WebSocket notification to target user
      emitSwapRequestCreated(theirSlot.userId.toString(), {
        requestId: (swapRequest[0]._id as any).toString(),
        requesterName: user.email, // You might want to fetch the full user name
        requesterSlotTitle: mySlot.title,
        targetSlotTitle: theirSlot.title,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          message: 'Swap request created successfully',
          swapRequest: {
            id: (swapRequest[0]._id as any).toString(),
            status: swapRequest[0].status,
            requesterId: swapRequest[0].requesterId.toString(),
            requesterSlotId: swapRequest[0].requesterSlotId.toString(),
            targetUserId: swapRequest[0].targetUserId.toString(),
            targetSlotId: swapRequest[0].targetSlotId.toString(),
          },
        },
        { status: 201 }
      );
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  } catch (error: any) {
    console.error('Create swap request error:', error);
    return NextResponse.json(
      { error: 'Failed to create swap request', details: error.message },
      { status: 500 }
    );
  }
});
