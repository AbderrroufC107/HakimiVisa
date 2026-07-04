const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.deviceToken.count()
  .then(c => {
    console.log('Device tokens:', c);
    return p.deviceToken.findMany({ take: 5, include: { user: { select: { email: true } } } });
  })
  .then(r => {
    console.log(JSON.stringify(r, null, 2));
    return p.$disconnect();
  })
  .catch(e => {
    console.error(e);
    return p.$disconnect();
  });
