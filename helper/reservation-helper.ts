export const reservationDateIsValid = (
  startDate: Date,
  endDate: Date
): boolean => {
  const now = new Date();
  return startDate < endDate && startDate > now && endDate > now;
};
