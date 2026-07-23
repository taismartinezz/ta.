export function participantStorageKey(slug: string): string {
  return `ta:participant:${slug}`;
}

export function editTokenStorageKey(slug: string): string {
  return `ta:edit-token:${slug}`;
}
