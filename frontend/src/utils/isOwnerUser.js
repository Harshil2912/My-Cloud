export function isOwnerUser(user) {
  if (!user) return false;

  const defaultOwnerEmails = [
    'solanki.harshil2912@gmail.com',
  ];

  const configuredOwnerEmails = (
    import.meta.env.VITE_OWNER_EMAILS
      || import.meta.env.VITE_OWNER_EMAIL
      || defaultOwnerEmails.join(',')
  )
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = (user.email || '').trim().toLowerCase();

  return configuredOwnerEmails.includes(userEmail);
}
