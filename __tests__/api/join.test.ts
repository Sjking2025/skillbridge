import handler from '../../pages/api/join';
import { NextApiRequest, NextApiResponse } from 'next';

jest.mock('../../src/services/googleClient', () => ({
  getOAuth2Client: jest.fn(),
  getGmail: jest.fn(),
  getSheets: jest.fn(),
  getCalendar: jest.fn(),
}));

jest.mock('isomorphic-dompurify', () => ({
  sanitize: (str: string) => str,
}));

describe('API Route - /api/join', () => {
  const mockReq = (body: any, method = 'POST', ip = '127.0.0.1'): NextApiRequest => ({
    method,
    body,
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: ip },
  } as unknown as NextApiRequest);

  const mockRes = (): NextApiResponse => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as NextApiResponse;
  };

  it('rejects methods other than POST', async () => {
    const req = mockReq({}, 'GET');
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('rejects missing required fields', async () => {
    const req = mockReq({ firstName: 'John' }); // missing email, college, etc.
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
  });

  it('rejects invalid emails', async () => {
    const req = mockReq({
      firstName: 'John',
      email: 'invalid-email',
      college: 'Test College',
      year: '1st Year',
      level: 'Beginner'
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email address' });
  });

  it('rate limits after 5 requests', async () => {
    const req = mockReq({
      firstName: 'Spammer',
      email: 'spam@spam.com',
      college: 'Spam College',
      year: '1st',
      level: 'Spam'
    }, 'POST', '10.0.0.1');

    for (let i = 0; i < 5; i++) {
      const res = mockRes();
      await handler(req, res);
      // Wait, we mocked googleClient but handler calls it and since we didn't mock implementations, it might throw, returning 500.
      // But rate limit comes BEFORE everything. So the 6th call should return 429.
    }

    const resLimit = mockRes();
    await handler(req, resLimit);
    expect(resLimit.status).toHaveBeenCalledWith(429);
    expect(resLimit.json).toHaveBeenCalledWith({ error: 'Too many requests, please try again later.' });
  });
});
