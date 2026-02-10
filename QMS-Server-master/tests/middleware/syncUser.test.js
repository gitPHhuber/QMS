const syncUserMiddleware = require('../../middleware/syncUserMiddleware');
const { User, Role } = require('../../models/index');


jest.mock('../../models/index', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    },
    Role: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findOrCreate: jest.fn()
    },
    Ability: {}
}));

describe('syncUserMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            auth: {
                payload: {
                    sub: 'keycloak-uuid-123',
                    preferred_username: 'testuser',
                    given_name: 'Ivan',
                    family_name: 'Ivanov',
                    realm_access: { roles: ['WAREHOUSE_MASTER'] }
                }
            }
        };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    test('Должен создать нового пользователя, если его нет', async () => {

        Role.findAll.mockResolvedValue([{ name: 'WAREHOUSE_MASTER' }, { name: 'VIEWER' }]);

        Role.findOne.mockResolvedValue({ id: 6, name: 'WAREHOUSE_MASTER', abilities: [{ code: 'warehouse.view' }] });

        User.findOne.mockResolvedValue(null);

        const createdUser = {
            id: 10,
            login: 'testuser',
            roleId: 6,
            save: jest.fn()
        };
        User.create.mockResolvedValue(createdUser);

        await syncUserMiddleware(req, res, next);

        expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
            login: 'testuser',
            roleId: 6
        }));
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(10);
        expect(req.user.abilities).toContain('warehouse.view');
        expect(next).toHaveBeenCalled();
    });

    test('Должен обновить роль существующего пользователя', async () => {

        Role.findAll.mockResolvedValue([{ name: 'WAREHOUSE_MASTER' }, { name: 'ASSEMBLER' }]);

        Role.findOne.mockResolvedValue({ id: 6, name: 'WAREHOUSE_MASTER', abilities: [] });

        const mockSave = jest.fn();
        const existingUser = {
            id: 20,
            login: 'testuser',
            roleId: 3,
            save: mockSave
        };

        User.findOne.mockResolvedValue(existingUser);

        await syncUserMiddleware(req, res, next);

        expect(existingUser.roleId).toBe(6);
        expect(mockSave).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    test('Должен вернуть 500 при ошибке БД', async () => {
        Role.findAll.mockRejectedValue(new Error('DB Connection failed'));

        await syncUserMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});
