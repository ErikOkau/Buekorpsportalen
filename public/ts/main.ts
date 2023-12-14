document.getElementById("logoutBtn")!.addEventListener("click", async function(event) {
    event.preventDefault(); 

    fetch('/logout', { method: 'GET' })
    try {
        const response = await fetch('/logout', { method: 'GET' });
        const data = await response.json();
        console.log('Logout response:', data);
    
    } catch (error) {
        console.error('Error during logout:', error);
    }
});