import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event, { EventStatus } from '@/models/Event';
import { withAuth } from '@/lib/middleware';
import { getSwapSuggestions } from '@/lib/groq';

// POST /api/ai/swap-suggestions - Get AI-powered swap suggestions
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    // Get user's swappable slots
    const mySlots = await Event.find({
      userId: user.userId,
      status: EventStatus.SWAPPABLE,
    });

    if (mySlots.length === 0) {
      return NextResponse.json(
        {
          message: 'No swappable slots found. Please mark some of your slots as swappable first.',
          suggestions: [],
        },
        { status: 200 }
      );
    }

    // Get available slots from other users
    const availableSlots = await Event.find({
      status: EventStatus.SWAPPABLE,
      userId: { $ne: user.userId },
    })
      .populate('userId', 'name email')
      .limit(20); // Limit to prevent token overflow

    if (availableSlots.length === 0) {
      return NextResponse.json(
        {
          message: 'No swappable slots available from other users.',
          suggestions: [],
        },
        { status: 200 }
      );
    }

    // Prepare data for AI
    const mySlotData = mySlots.map((s) => ({
      id: (s._id as any).toString(),
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    const availableSlotData = availableSlots.map((s) => ({
      id: (s._id as any).toString(),
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      owner: {
        id: ((s.userId as any)._id as any).toString(),
        name: (s.userId as any).name,
        email: (s.userId as any).email,
      },
    }));

    // Get AI suggestions
    const suggestions = await getSwapSuggestions(mySlotData, availableSlotData);

    // Enrich suggestions with full slot details
    const enrichedSuggestions = suggestions.map((sug) => {
      const targetSlot = availableSlotData.find((s) => s.id === sug.targetSlotId);
      const mySlot = mySlotData.find((s) => s.id === sug.mySlotId);

      return {
        ...sug,
        targetSlot,
        mySlot,
      };
    });

    return NextResponse.json(
      {
        message: 'AI suggestions generated successfully',
        suggestions: enrichedSuggestions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('AI swap suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate swap suggestions', details: error.message },
      { status: 500 }
    );
  }
});
