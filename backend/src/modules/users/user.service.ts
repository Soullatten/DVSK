import { prisma } from "../../config/database.js";

export async function updateProfile(userId: string, data: { name?: string; avatar?: string }) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function getAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
}

export async function createAddress(userId: string, data: any) {
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.create({ data: { ...data, userId } });
}

export async function updateAddress(userId: string, addressId: string, data: any) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return null;

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.update({ where: { id: addressId }, data });
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return null;
  return prisma.address.delete({ where: { id: addressId } });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return null;

  await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  return prisma.address.update({ where: { id: addressId }, data: { isDefault: true } });
}
