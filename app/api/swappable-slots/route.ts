import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event, { EventStatus } from '@/models/Event';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';

// GET /api/swappable-slots - Get all swappable slots from other users
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    // Find all SWAPPABLE events that don't belong to the current user
    const swappableSlots = await Event.find({
      status: EventStatus.SWAPPABLE,
      userId: { $ne: user.userId },
    })
      .populate('userId', 'name email')
      .sort({ startTime: 1 });

    return NextResponse.json(
      {
        slots: swappableSlots.map((slot) => ({
          id: (slot._id as any).toString(),
          title: slot.title,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
          description: slot.description,
          owner: {
            id: ((slot.userId as any)._id as any).toString(),
            name: (slot.userId as any).name,
            email: (slot.userId as any).email,
          },
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get swappable slots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swappable slots', details: error.message },
      { status: 500 }
    );
  }
});
