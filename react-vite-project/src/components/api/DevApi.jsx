import fetcher from '../../utils/fetcher.js';
import {handleResponse} from './Api.jsx';

// GET /api/dev/users -> UserResponseDto[]
export async function getDevUsers() {
    return handleResponse(await fetcher("dev/users"));
}

// POST /api/dev/login-as?email=... -> {tokenType, accessToken}
export async function devLoginAs(email) {
    return handleResponse(await fetcher(`dev/login-as?email=${encodeURIComponent(email)}`, {method: "POST"}));
}