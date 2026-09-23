import React from 'react';

function ErrorPage({error}) {
    return (
        <p>{error.message}</p>
    );
}

export default ErrorPage;
