const syncUserMiddleware = require('../../middleware/syncUserMiddleware');
const { User, Role, Ability } = require('../../models/index');


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

        Role.findAll.mockResolvedValue([
            { name: 'WAREHOUSE_MASTER', id: 5 }
        ]);

        User.findOne.mockResolvedValue(null);

        const createdUser = {
            id: 10,
            login: 'testuser',
            name: 'Ivan',
            surname: 'Ivanov',
            roleId: 5,
            save: jest.fn()
        };
        User.create.mockResolvedValue(createdUser);

        Role.findOne.mockResolvedValue({ abilities: [{ code: 'warehouse.view' }] });

        await syncUserMiddleware(req, res, next);

        expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
            login: 'testuser',
            roleId: 5
        }));
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(10);
        expect(req.user.role).toBe('WAREHOUSE_MASTER');
        expect(req.user.abilities).toContain('warehouse.view');
        expect(next).toHaveBeenCalled();
    });

    test('Должен обновить роль существующего пользователя', async () => {

        Role.findAll.mockResolvedValue([
            { name: 'WAREHOUSE_MASTER', id: 5 },
            { name: 'ASSEMBLER', id: 3 }
        ]);

        const mockSave = jest.fn();
        const existingUser = {
            id: 20,
            login: 'testuser',
            name: 'Ivan',
            surname: 'Ivanov',
            roleId: 3,
            userRole: { name: 'ASSEMBLER' },
            save: mockSave
        };

        User.findOne.mockResolvedValue(existingUser);
        Role.findOne.mockResolvedValue({ abilities: [] });

        await syncUserMiddleware(req, res, next);

        expect(existingUser.roleId).toBe(5);
        expect(mockSave).toHaveBeenCalled();
        expect(req.user.role).toBe('WAREHOUSE_MASTER');
        expect(next).toHaveBeenCalled();
    });

    test('Должен вернуть 500 при ошибке БД', async () => {
        Role.findAll.mockRejectedValue(new Error('DB Connection failed'));

        await syncUserMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});
