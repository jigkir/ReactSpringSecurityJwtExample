import fetcher from '../../utils/fetcher.js';

// region Default Handle Response
async function handleResponse(response) {
    if (!response.ok) {
        let body = {};
        try {
            body = await response.json();
        } catch {
            // non-JSON body
        }
        const error = new Error(body.message || `Erreur ${response.status}`);
        error.status = response.status;
        error.body = body;
        throw error;
    }
    return response.json();
}

// endregion

// region Login
export async function login(email, password) {
    const response = await fetcher("login", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({email, password}),
    });
    return handleResponse(response);
}

// endregion

// region Current User
export async function getCurrentUser() {
    const response = await fetcher("users/current", {});
    return handleResponse(response);
}

// endregion

// region CV Count for Student
export async function getCvCount(studentId) {
    const response = await fetcher(`student/${studentId}/cvs/count`, {});
    return handleResponse(response);
}

// endregion