import {beforeEach, describe, expect, it, vi} from 'vitest';
import fetcher from '../../../utils/fetcher.js';
import {devLoginAs, getDevUsers} from '../DevApi.jsx';

vi.mock('../../../utils/fetcher.js', () => ({default: vi.fn()}));

const okResponse = (body) => ({ok: true, status: 200, json: async () => body});
const errorResponse = (status, body = {}) => ({ok: false, status, json: async () => body});

beforeEach(() => {
    vi.resetAllMocks();
});

describe('getDevUsers', () => {
    it('shouldReturnMockUsersWhenRequestSucceeds', async () => {
        const users = [{id: 1, email: 'a@x.com', firstName: 'A', lastName: 'B', role: 'STUDENT'}];
        fetcher.mockResolvedValueOnce(okResponse(users));

        const result = await getDevUsers();

        expect(fetcher).toHaveBeenCalledWith('dev/users');
        expect(result).toEqual(users);
    });

    it('shouldThrowErrorWithStatusAndI18nKeyWhenForbidden', async () => {
        fetcher.mockResolvedValueOnce(errorResponse(403));

        await expect(getDevUsers()).rejects.toMatchObject({
            status: 403,
            i18n: {key: 'error.forbidden'},
        });
    });

    it('shouldThrowServerErrorKeyWhenBackendFails', async () => {
        fetcher.mockResolvedValueOnce(errorResponse(500));

        await expect(getDevUsers()).rejects.toMatchObject({
            status: 500,
            i18n: {key: 'error.server', options: {status: 500}},
        });
    });
});

describe('devLoginAs', () => {
    it('shouldPostToLoginAsWithEncodedEmailAndReturnToken', async () => {
        const token = {tokenType: 'Bearer', accessToken: 'jwt'};
        fetcher.mockResolvedValueOnce(okResponse(token));

        const result = await devLoginAs('a+b@x.com');

        expect(fetcher).toHaveBeenCalledWith('dev/login-as?email=a%2Bb%40x.com', {method: 'POST'});
        expect(result).toEqual(token);
    });

    it('shouldThrowNotFoundWhenUserDoesNotExist', async () => {
        fetcher.mockResolvedValueOnce(errorResponse(404));

        await expect(devLoginAs('ghost@x.com')).rejects.toMatchObject({
            status: 404,
            i18n: {key: 'error.notFound'},
        });
    });

    it('shouldPropagateNetworkFailure', async () => {
        fetcher.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(devLoginAs('a@x.com')).rejects.toThrow('Failed to fetch');
    });
});