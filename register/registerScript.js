function register(event) {
    event.preventDefault(); // Prevents the form from submitting (for demo purposes)

    // Perform authentication (to be implemented on the server side)
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Example: Check if username and password match a predefined set of credentials
    if (username === 'demo' && password === 'password') {
        alert('Sign in successful!'); // Replace with redirection or other actions
    } else {
        alert('Invalid username or password');
    }
}
