export function getInitials(nameOrEmail: string): string {
  return nameOrEmail
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
