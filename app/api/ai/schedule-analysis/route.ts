import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { withAuth } from '@/lib/middleware';
import { detectScheduleConflicts } from '@/lib/groq';

// GET /api/ai/schedule-analysis - Analyze user's schedule for conflicts
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const events = await Event.find({ userId: user.userId }).sort({ startTime: 1 });

    if (events.length === 0) {
      return NextResponse.json(
        {
          message: 'No events found in your schedule.',
          conflicts: [],
        },
        { status: 200 }
      );
    }

    const eventData = events.map((e) => ({
      id: (e._id as any).toString(),
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
      status: e.status,
    }));

    const conflicts = await detectScheduleConflicts(eventData);

    return NextResponse.json(
      {
        message: 'Schedule analysis completed',
        conflicts,
        eventCount: events.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('AI schedule analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze schedule', details: error.message },
      { status: 500 }
    );
  }
});
