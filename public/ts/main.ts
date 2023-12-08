document.getElementById("logoutBtn")!.addEventListener("click", function(event) {
    event.preventDefault(); 

    fetch('/logout', { method: 'GET' })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url; // Redirect to login page after logout
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
});