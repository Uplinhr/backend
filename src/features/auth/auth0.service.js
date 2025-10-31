import prisma from '../../database/prisma.js';

const PROVIDER_MAP = {
  'google-oauth2': 'GOOGLE',
  'linkedin': 'LINKEDIN',
  'email': 'MAGIC_LINK',
};

function mapProviderFromSub(sub) {
  if (!sub || typeof sub !== 'string') return 'MAGIC_LINK';
  const [provider] = sub.split('|');
  return PROVIDER_MAP[provider] || 'MAGIC_LINK';
}

export async function syncUserFromAuth0Claims(claims) {
  const {
    sub,
    email,
    email_verified: emailVerified,
    name,
    given_name: firstName,
    family_name: lastName,
    picture,
    locale,
  } = claims || {};

  if (!sub || !email) throw new Error('Missing Auth0 claims');

  const provider = mapProviderFromSub(sub);

  const existingByAuth0 = await prisma.user.findUnique({ where: { auth0Id: sub } });
  const existingByEmail = await prisma.user.findUnique({ where: { email } });

  const userBase = {
    auth0Id: sub,
    email,
    emailVerified: !!emailVerified,
    provider,
    fullName: name ?? null,
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    pictureUrl: picture ?? null,
    locale: locale ?? null,
  };

  let user;
  if (existingByAuth0) {
    user = await prisma.user.update({ where: { id: existingByAuth0.id }, data: userBase });
  } else if (existingByEmail) {
    user = await prisma.user.update({ where: { id: existingByEmail.id }, data: userBase });
  } else {
    user = await prisma.user.create({ data: userBase });
  }

  await prisma.userIdentity.upsert({
    where: { provider_providerUserId: { provider, providerUserId: sub } },
    update: { rawProfile: claims },
    create: { userId: user.id, provider, providerUserId: sub, rawProfile: claims },
  });

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  const company = await prisma.companyProfile.findUnique({ where: { userId: user.id } });

  const missing = computeMissingFields(provider, user, profile, company);
  const profileCompleted = missing.length === 0;

  if (user.profileCompleted !== profileCompleted) {
    user = await prisma.user.update({ where: { id: user.id }, data: { profileCompleted } });
  }

  return { user, profileCompleted, missingFields: missing };
}

export function computeMissingFields(provider, user, profile, company) {
  const missing = [];
  const need = (obj, key) => { if (!obj || obj[key] == null || obj[key] === '') missing.push(key); };

  need(user, 'email');
  need(user, 'firstName');
  need(user, 'lastName');
  need(user, 'phone');

  const personalKeys = ['country', 'city', 'address', 'postalCode'];
  personalKeys.forEach(k => need(profile, k));

  if (provider === 'MAGIC_LINK') {
    ['documentType', 'documentNumber', 'dateOfBirth'].forEach(k => need(profile, k));
  }

  // Empresa opcional: completar si el usuario indica que es empresa (se enviará en profile/complete)
  return missing;
}

export async function completeProfile(userId, payload) {
  const { personal = {}, company = {} } = payload || {};

  if (Object.keys(personal).length > 0) {
    await prisma.userProfile.upsert({
      where: { userId },
      update: personal,
      create: { userId, ...personal },
    });
  }

  if (Object.keys(company).length > 0) {
    await prisma.companyProfile.upsert({
      where: { userId },
      update: company,
      create: { userId, ...company },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const companyProfile = await prisma.companyProfile.findUnique({ where: { userId } });
  const missing = computeMissingFields(user.provider, user, profile, companyProfile);
  const profileCompleted = missing.length === 0;
  if (user.profileCompleted !== profileCompleted) {
    await prisma.user.update({ where: { id: userId }, data: { profileCompleted } });
  }
  return { profileCompleted, missingFields: missing };
}
