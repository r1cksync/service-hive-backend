import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event, { EventStatus } from '@/models/Event';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';

// GET /api/events - Get all events for the logged-in user
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const events = await Event.find({ userId: user.userId }).sort({ startTime: 1 });

    return NextResponse.json(
      {
        events: events.map((event) => ({
          id: (event._id as any).toString(),
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          status: event.status,
          description: event.description,
          userId: event.userId.toString(),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    );
  }
});

// POST /api/events - Create a new event
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const body = await request.json();
    const { title, startTime, endTime, description, status } = body;

    // Validation
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Please provide title, startTime, and endTime' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Create event
    const event = await Event.create({
      title,
      startTime: start,
      endTime: end,
      status: status || EventStatus.BUSY,
      description,
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    return NextResponse.json(
      {
        message: 'Event created successfully',
        event: {
          id: (event._id as any).toString(),
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          status: event.status,
          description: event.description,
          userId: event.userId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
});
