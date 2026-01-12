export const findUserByEmail = async (prisma, email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};
