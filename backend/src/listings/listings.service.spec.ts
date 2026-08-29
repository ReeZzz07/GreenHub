import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListingStatus, NotificationType, UserRole } from '@prisma/client';
import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ListingsService', () => {
  let service: ListingsService;
  let prisma: {
    listing: { findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };
  let notifications: { create: jest.Mock };

  const seller = { id: 'seller-1', role: UserRole.SELLER_INDIVIDUAL };
  const admin = { id: 'admin-1', role: UserRole.ADMIN };
  const stranger = { id: 'stranger-1', role: UserRole.SELLER_INDIVIDUAL };

  beforeEach(async () => {
    prisma = {
      listing: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    };
    notifications = { create: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(ListingsService);
  });

  describe('ownership checks (update/remove/availability/analytics)', () => {
    it('throws NotFoundException when the listing does not exist', async () => {
      prisma.listing.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing', seller)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('blocks a user who does not own the listing and is not an admin', async () => {
      prisma.listing.findUnique.mockResolvedValue({ id: 'l1', sellerId: seller.id, status: ListingStatus.PUBLISHED });
      await expect(service.remove('l1', stranger)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets an admin act on a listing they do not own', async () => {
      prisma.listing.findUnique.mockResolvedValue({ id: 'l1', sellerId: seller.id, status: ListingStatus.PUBLISHED });
      prisma.listing.delete.mockResolvedValue({});
      await expect(service.remove('l1', admin)).resolves.toEqual({ success: true });
    });
  });

  describe('update', () => {
    it('sends a published listing back to moderation when a non-admin owner edits it', async () => {
      prisma.listing.findUnique.mockResolvedValue({ id: 'l1', sellerId: seller.id, status: ListingStatus.PUBLISHED });
      prisma.listing.update.mockImplementation(({ data }) => data);

      const result = await service.update('l1', { title: 'New title' }, seller);

      expect(result.status).toBe(ListingStatus.PENDING_MODERATION);
      expect(result.rejectionReason).toBeNull();
    });

    it('does not reset a listing that is already pending moderation', async () => {
      prisma.listing.findUnique.mockResolvedValue({
        id: 'l1',
        sellerId: seller.id,
        status: ListingStatus.PENDING_MODERATION,
      });
      prisma.listing.update.mockImplementation(({ data }) => data);

      const result = await service.update('l1', { title: 'New title' }, seller);

      expect(result.status).toBeUndefined();
    });

    it('lets an admin edit a published listing without forcing re-moderation', async () => {
      prisma.listing.findUnique.mockResolvedValue({ id: 'l1', sellerId: seller.id, status: ListingStatus.PUBLISHED });
      prisma.listing.update.mockImplementation(({ data }) => data);

      const result = await service.update('l1', { title: 'New title' }, admin);

      expect(result.status).toBeUndefined();
    });
  });

  describe('updateAvailability', () => {
    it('refuses to mark a non-published listing as sold', async () => {
      prisma.listing.findUnique.mockResolvedValue({
        id: 'l1',
        sellerId: seller.id,
        status: ListingStatus.PENDING_MODERATION,
      });

      await expect(service.updateAvailability('l1', { action: 'mark_sold' }, seller)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refuses to relist a listing that is not sold', async () => {
      prisma.listing.findUnique.mockResolvedValue({ id: 'l1', sellerId: seller.id, status: ListingStatus.PUBLISHED });

      await expect(service.updateAvailability('l1', { action: 'relist' }, seller)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('moderate', () => {
    const listing = { id: 'l1', title: 'Монстера', sellerId: 'seller-1' };

    it('publishes the listing and notifies the seller on approval', async () => {
      prisma.listing.findUnique.mockResolvedValue(listing);
      prisma.listing.update.mockResolvedValue({ ...listing, status: ListingStatus.PUBLISHED });

      await service.moderate('l1', { action: 'approve' });

      expect(prisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ListingStatus.PUBLISHED, rejectionReason: null } }),
      );
      expect(notifications.create).toHaveBeenCalledWith(
        'seller-1',
        NotificationType.LISTING_APPROVED,
        expect.any(String),
        expect.any(String),
        `/plant/l1`,
      );
    });

    it('rejects the listing with the given reason and notifies the seller', async () => {
      prisma.listing.findUnique.mockResolvedValue(listing);
      prisma.listing.update.mockResolvedValue({ ...listing, status: ListingStatus.REJECTED });

      await service.moderate('l1', { action: 'reject', reason: 'Некачественное фото' });

      expect(prisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: ListingStatus.REJECTED, rejectionReason: 'Некачественное фото' },
        }),
      );
      expect(notifications.create).toHaveBeenCalledWith(
        'seller-1',
        NotificationType.LISTING_REJECTED,
        expect.any(String),
        expect.stringContaining('Некачественное фото'),
        '/listings/mine',
      );
    });
  });
});
