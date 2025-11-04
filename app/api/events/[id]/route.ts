import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event, { EventStatus } from '@/models/Event';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';

// GET /api/events/[id] - Get a specific event
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!mongoose.Types.ObjectId.isValid(id!)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const event = await Event.findOne({
      _id: id,
      userId: user.userId,
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
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
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event', details: error.message },
      { status: 500 }
    );
  }
});

// PUT /api/events/[id] - Update a specific event
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!mongoose.Types.ObjectId.isValid(id!)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, startTime, endTime, description, status } = body;

    const event = await Event.findOne({
      _id: id,
      userId: user.userId,
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is in SWAP_PENDING status
    if (event.status === EventStatus.SWAP_PENDING && status !== EventStatus.SWAP_PENDING) {
      return NextResponse.json(
        { error: 'Cannot modify event with pending swap. Cancel the swap first.' },
        { status: 400 }
      );
    }

    // Update fields
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (status !== undefined) {
      // Validate status transition
      if (status === EventStatus.SWAP_PENDING) {
        return NextResponse.json(
          { error: 'Cannot manually set status to SWAP_PENDING' },
          { status: 400 }
        );
      }
      event.status = status;
    }

    if (startTime !== undefined) {
      const start = new Date(startTime);
      event.startTime = start;
    }

    if (endTime !== undefined) {
      const end = new Date(endTime);
      event.endTime = end;
    }

    // Validate times
    if (event.endTime <= event.startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    await event.save();

    return NextResponse.json(
      {
        message: 'Event updated successfully',
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
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE /api/events/[id] - Delete a specific event
export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!mongoose.Types.ObjectId.isValid(id!)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const event = await Event.findOne({
      _id: id,
      userId: user.userId,
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is in SWAP_PENDING status
    if (event.status === EventStatus.SWAP_PENDING) {
      return NextResponse.json(
        { error: 'Cannot delete event with pending swap. Cancel the swap first.' },
        { status: 400 }
      );
    }

    await Event.deleteOne({ _id: id });

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: error.message },
      { status: 500 }
    );
  }
});
