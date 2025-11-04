import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SwapRequest, { SwapRequestStatus } from '@/models/SwapRequest';
import { withAuth } from '@/lib/middleware';

// GET /api/swap-requests - Get incoming and outgoing swap requests for the user
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'incoming' or 'outgoing'

    let query: any = {};

    if (type === 'incoming') {
      // Requests where the user is the target
      query = { targetUserId: user.userId };
    } else if (type === 'outgoing') {
      // Requests where the user is the requester
      query = { requesterId: user.userId };
    } else {
      // Both incoming and outgoing
      query = {
        $or: [{ targetUserId: user.userId }, { requesterId: user.userId }],
      };
    }

    const swapRequests = await SwapRequest.find(query)
      .populate('requesterId', 'name email')
      .populate('requesterSlotId')
      .populate('targetUserId', 'name email')
      .populate('targetSlotId')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        requests: swapRequests.map((req) => ({
          id: (req._id as any).toString(),
          status: req.status,
          createdAt: req.createdAt,
          requester: {
            id: ((req.requesterId as any)._id as any).toString(),
            name: (req.requesterId as any).name,
            email: (req.requesterId as any).email,
          },
          requesterSlot: {
            id: ((req.requesterSlotId as any)._id as any).toString(),
            title: (req.requesterSlotId as any).title,
            startTime: (req.requesterSlotId as any).startTime,
            endTime: (req.requesterSlotId as any).endTime,
            status: (req.requesterSlotId as any).status,
          },
          targetUser: {
            id: ((req.targetUserId as any)._id as any).toString(),
            name: (req.targetUserId as any).name,
            email: (req.targetUserId as any).email,
          },
          targetSlot: {
            id: ((req.targetSlotId as any)._id as any).toString(),
            title: (req.targetSlotId as any).title,
            startTime: (req.targetSlotId as any).startTime,
            endTime: (req.targetSlotId as any).endTime,
            status: (req.targetSlotId as any).status,
          },
          isIncoming: ((req.targetUserId as any)._id as any).toString() === user.userId,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get swap requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swap requests', details: error.message },
      { status: 500 }
    );
  }
});
