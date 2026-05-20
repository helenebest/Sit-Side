const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockUserModel = jest.fn().mockImplementation(function MockUser(data) {
  Object.assign(this, data);
  this._id = 'new-user-id';
  this.isVerified = false;
  this.rating = 0;
  this.reviewCount = 0;
  this.save = mockSave;
});
mockUserModel.findOne = mockFindOne;

jest.mock('../backend/models/User', () => mockUserModel);
jest.mock('../backend/lib/jwtSecret', () => ({
  getJwtSecret: () => 'test-secret',
}));
jest.mock('../backend/services/slack', () => ({
  notifyAdminPendingUserApproval: jest.fn(),
}));

const authRouter = require('../backend/routes/auth');

function routeHandler(method, path) {
  const layer = authRouter.stack.find(
    (item) => item.route?.path === path && item.route.methods[method]
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockResponse() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe('auth registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockResolvedValue(null);
    mockSave.mockResolvedValue(undefined);
  });

  it('rejects public admin self-registration', async () => {
    const handler = routeHandler('post', '/register');
    const req = {
      body: {
        email: 'attacker@example.com',
        password: 'password123',
        firstName: 'Eve',
        lastName: 'Attacker',
        phone: '555-0101',
        userType: 'admin',
      },
    };
    const res = mockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user type' });
    expect(mockUserModel).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });
});
