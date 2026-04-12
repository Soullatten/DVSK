import { firebaseAuth } from "../../config/firebase.js";
import { prisma } from "../../config/database.js";

export async function verifyAndGetUser(firebaseToken: string, name?: string) {
  const decoded = await firebaseAuth.verifyIdToken(firebaseToken);

  let user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
    include: { addresses: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseUid: decoded.uid,
        email: decoded.email || null,
        phone: decoded.phone_number || null,
        name: name || decoded.name || null,
        avatar: decoded.picture || null,
      },
      include: { addresses: true },
    });
  }

  return user;
}

export async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: true },
  });
}
