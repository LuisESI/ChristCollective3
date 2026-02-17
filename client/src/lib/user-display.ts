type UserLike = {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
};

export function getUserDisplayName(user: UserLike | null | undefined): string {
  if (!user) return "User";
  if (user.displayName) return user.displayName;
  const full = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (full) return full;
  return user.username || "User";
}

export function getUserInitials(user: UserLike | null | undefined): string {
  const name = getUserDisplayName(user);
  if (name === "User") return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
