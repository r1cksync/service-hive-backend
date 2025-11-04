import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { getUserFromRequest } from '@/lib/jwt';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch user's events
    const myEvents = await Event.find({ userId: user.userId }).sort({ startTime: 1 });

    // Fetch marketplace events (other users' swappable slots)
    const marketplaceEvents = await Event.find({
      userId: { $ne: user.userId },
      status: 'SWAPPABLE',
    })
      .populate('userId', 'name email')
      .sort({ startTime: 1 })
      .limit(20);

    // Build context for AI
    const now = new Date();
    const myUpcomingEvents = myEvents.filter((e) => new Date(e.startTime) > now);
    const mySwappableEvents = myEvents.filter((e) => e.status === 'SWAPPABLE');

    const context = `
Current Date/Time: ${now.toISOString()}

USER'S SCHEDULE:
Total Events: ${myEvents.length}
Upcoming Events: ${myUpcomingEvents.length}
Swappable Slots: ${mySwappableEvents.length}

My Events:
${myEvents
  .slice(0, 15)
  .map(
    (e) =>
      `- ${e.title} | ${new Date(e.startTime).toLocaleString()} to ${new Date(e.endTime).toLocaleString()} | Status: ${e.status}${
        e.description ? ` | Notes: ${e.description}` : ''
      }`
  )
  .join('\n')}

My Swappable Slots:
${mySwappableEvents.length > 0
  ? mySwappableEvents
      .map(
        (e) =>
          `- ${e.title} | ${new Date(e.startTime).toLocaleString()} to ${new Date(e.endTime).toLocaleString()}`
      )
      .join('\n')
  : 'None currently marked as swappable'}

MARKETPLACE (Available Swaps from Others):
${marketplaceEvents.length > 0
  ? marketplaceEvents
      .map(
        (e: any) =>
          `- ${e.title} | ${new Date(e.startTime).toLocaleString()} to ${new Date(e.endTime).toLocaleString()} | Offered by: ${e.userId?.name || 'Unknown'}${
            e.description ? ` | Notes: ${e.description}` : ''
          }`
      )
      .join('\n')
  : 'No swappable slots currently available in the marketplace'}
`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI scheduling assistant for ServiceHive, a shift/schedule swapping platform. 
Help users optimize their schedules, find swap opportunities, and answer questions about their calendar.

You have access to:
1. The user's current schedule (all their events)
2. Marketplace slots (events other users want to swap)

When suggesting swaps:
- Consider time conflicts and preferences
- Explain why a swap would be beneficial
- Be specific about event details

Be friendly, concise, and actionable. Format responses clearly with bullet points when listing multiple items.`,
        },
        {
          role: 'user',
          content: `${context}\n\nUser Question: ${message}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ response }, { status: 200 });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error.message },
      { status: 500 }
    );
  }
}
