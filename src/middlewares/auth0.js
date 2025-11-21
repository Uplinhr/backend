import { auth } from 'express-oauth2-jwt-bearer';

const audience = process.env.AUTH0_AUDIENCE;
const domain = process.env.AUTH0_DOMAIN;

let requireAuth0;
if (audience && domain) {
  requireAuth0 = auth({
    audience,
    issuerBaseURL: `https://${domain}/`,
    tokenSigningAlg: 'RS256',
  });
} else {
  requireAuth0 = (req, res, next) => next();
}

export default requireAuth0;
