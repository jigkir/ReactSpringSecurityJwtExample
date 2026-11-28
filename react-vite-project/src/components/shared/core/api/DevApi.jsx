import fetcher from "../../../../utils/fetcher.js";
import {handleResponse} from "./Api.jsx";

// GET /api/dev/users -> UserResponseDto[]
export async function getDevUsers() {
    return handleResponse(await fetcher("dev/users"));
}

// POST /api/dev/login-as?email=... -> {tokenType, accessToken}
export async function devLoginAs(email) {
    return handleResponse(await fetcher(`dev/login-as?email=${encodeURIComponent(email)}`, {method: "POST"}));
}

// PUT /api/dev/contracts/{id}/signature?email=... -> ContractResponseDto (no password, no checkbox)
export async function devSignContract(contractId, email) {
    return handleResponse(await fetcher(
        `dev/contracts/${contractId}/signature?email=${encodeURIComponent(email)}`, {method: "PUT"}));
}

export async function devSignWorkplaceEvaluation(evaluationId, email) {
    return handleResponse(await fetcher(`dev/workplace-evaluations/${evaluationId}/signature?email=${encodeURIComponent(email)}`, {method: "PUT"}))
}