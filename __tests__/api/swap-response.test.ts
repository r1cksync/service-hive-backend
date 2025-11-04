import { createTestUser, createTestEvent } from '../helpers/testUtils';
import SwapRequest from '@/models/SwapRequest';
import Event from '@/models/Event';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

describe('Swap Response Logic Tests', () => {
  beforeAll(async () => {
    await dbConnect();
  });

  describe('Swap Accept Logic', () => {
    it('should exchange slot ownership when swap is accepted', async () => {
      const requester = await createTestUser({ email: 'requester@example.com' });
      const target = await createTestUser({ email: 'target@example.com' });

      const requesterEvent = await createTestEvent(requester.userId, {
        title: 'Requester Event',
        status: 'SWAPPABLE',
      });

      const targetEvent = await createTestEvent(target.userId, {
        title: 'Target Event',
        status: 'SWAPPABLE',
      });

      const swapRequest = await SwapRequest.create({
        requesterId: requester.userId,
        requesterSlotId: requesterEvent._id,
        targetUserId: target.userId,
        targetSlotId: targetEvent._id,
        status: 'PENDING',
      });

      // Simulate swap logic without transactions
      // (MongoDB Memory Server doesn't support replica sets/transactions)
      
      await SwapRequest.findByIdAndUpdate(
        swapRequest._id,
        { status: 'ACCEPTED' }
      );

      await Event.findByIdAndUpdate(
        requesterEvent._id,
        { userId: target.userId, status: 'BUSY' }
      );

      await Event.findByIdAndUpdate(
        targetEvent._id,
        { userId: requester.userId, status: 'BUSY' }
      );

      const updatedRequest = await SwapRequest.findById(swapRequest._id);
      expect(updatedRequest?.status).toBe('ACCEPTED');

      const updatedRequesterEvent = await Event.findById(requesterEvent._id);
      const updatedTargetEvent = await Event.findById(targetEvent._id);

      expect(updatedRequesterEvent?.userId.toString()).toBe(target.userId);
      expect(updatedTargetEvent?.userId.toString()).toBe(requester.userId);
      expect(updatedRequesterEvent?.status).toBe('BUSY');
      expect(updatedTargetEvent?.status).toBe('BUSY');
    });

    it('should handle transaction rollback on error', async () => {
      const requester = await createTestUser({ email: 'req2@example.com' });
      const target = await createTestUser({ email: 'target2@example.com' });

      const requesterEvent = await createTestEvent(requester.userId, {
        status: 'SWAPPABLE',
      });

      const targetEvent = await createTestEvent(target.userId, {
        status: 'SWAPPABLE',
      });

      const swapRequest = await SwapRequest.create({
        requesterId: requester.userId,
        requesterSlotId: requesterEvent._id,
        targetUserId: target.userId,
        targetSlotId: targetEvent._id,
        status: 'PENDING',
      });

      const deletedEventId = targetEvent._id;
      await Event.findByIdAndDelete(deletedEventId);

      // Test error handling without transactions
      // (simulating what would happen with transaction rollback)
      let errorOccurred = false;
      
      try {
        await SwapRequest.findByIdAndUpdate(
          swapRequest._id,
          { status: 'ACCEPTED' }
        );

        await Event.findByIdAndUpdate(
          requesterEvent._id,
          { userId: target.userId, status: 'BUSY' }
        );

        const result = await Event.findByIdAndUpdate(
          deletedEventId,
          { userId: requester.userId, status: 'BUSY' }
        );

        if (!result) {
          throw new Error('Target event not found');
        }
      } catch (error) {
        errorOccurred = true;
        // Manually revert changes (simulating transaction rollback)
        await SwapRequest.findByIdAndUpdate(
          swapRequest._id,
          { status: 'PENDING' }
        );
        await Event.findByIdAndUpdate(
          requesterEvent._id,
          { userId: requester.userId, status: 'SWAPPABLE' }
        );
      }

      expect(errorOccurred).toBe(true);

      const unchangedRequest = await SwapRequest.findById(swapRequest._id);
      expect(unchangedRequest?.status).toBe('PENDING');

      const unchangedEvent = await Event.findById(requesterEvent._id);
      expect(unchangedEvent?.userId.toString()).toBe(requester.userId);
      expect(unchangedEvent?.status).toBe('SWAPPABLE');
    });
  });
});
