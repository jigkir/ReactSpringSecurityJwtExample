import fetcher from "../../../../utils/api/fetcher.js";
import {handleResponse} from "./Api.jsx";


export async function getDevUsers() {
    return handleResponse(await fetcher("dev/users"));
}


export async function devLoginAs(email) {
    return handleResponse(await fetcher(`dev/login-as?email=${encodeURIComponent(email)}`, {method: "POST"}));
}


export async function devSignContract(contractId, email) {
    return handleResponse(await fetcher(
        `dev/contracts/${contractId}/signature?email=${encodeURIComponent(email)}`, {method: "PUT"}));
}

export async function devSignWorkplaceEvaluation(evaluationId, email) {
    return handleResponse(await fetcher(`dev/workplace-evaluations/${evaluationId}/signature?email=${encodeURIComponent(email)}`, {method: "PUT"}))
}
