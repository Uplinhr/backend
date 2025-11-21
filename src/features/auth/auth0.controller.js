import { syncUserFromAuth0Claims, completeProfile } from './auth0.service.js';

export const sync = async (req, res) => {
  try {
    const claims = req.auth?.payload;
    if (!claims) return res.status(401).json({ error: 'Unauthorized' });
    if (process.env.DEV) {
      console.log('[AUTH0][SYNC] claims:', {
        sub: claims.sub,
        email: claims.email,
        email_verified: claims.email_verified,
        name: claims.name,
      });
    }
    const result = await syncUserFromAuth0Claims(claims);
    if (process.env.DEV) {
      console.log('[AUTH0][SYNC] result:', {
        userId: result?.user?.id,
        email: result?.user?.email,
        profileCompleted: result?.profileCompleted,
        missingFields: result?.missingFields,
      });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const me = async (req, res) => {
  try {
    const claims = req.auth?.payload;
    if (!claims) return res.status(401).json({ error: 'Unauthorized' });
    if (process.env.DEV) {
      console.log('[AUTH0][ME] claims:', {
        sub: claims.sub,
        email: claims.email,
        email_verified: claims.email_verified,
      });
    }
    // El servicio de sync devuelve user + profileCompleted + missingFields
    const result = await syncUserFromAuth0Claims(claims);
    if (process.env.DEV) {
      console.log('[AUTH0][ME] result:', {
        userId: result?.user?.id,
        email: result?.user?.email,
        profileCompleted: result?.profileCompleted,
      });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const profileCompletion = async (req, res) => {
  try {
    const claims = req.auth?.payload;
    if (!claims) return res.status(401).json({ error: 'Unauthorized' });

    const result = await syncUserFromAuth0Claims(claims);
    const { missingFields, profileCompleted } = result;
    return res.json({ success: true, data: { missingFields, profileCompleted } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const complete = async (req, res) => {
  try {
    const claims = req.auth?.payload;
    if (!claims) return res.status(401).json({ error: 'Unauthorized' });

    const { user } = await syncUserFromAuth0Claims(claims);
    const completion = await completeProfile(user.id, req.body);
    return res.json({ success: true, data: completion });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
