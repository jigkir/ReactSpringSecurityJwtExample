function ErrorPage({error}) {
    return (
        <p>{error?.message ?? "unknown"}</p>
    );
}

export default ErrorPage;
