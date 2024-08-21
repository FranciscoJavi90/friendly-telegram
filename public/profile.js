console.log("Hola");
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const user = await response.json();

        document.getElementById('user-name').textContent = user.display_name || 'N/A';
        document.getElementById('user-email').textContent = user.email || 'N/A';
        document.getElementById('user-image').src = user.images && user.images.length > 0 ? user.images[0].url : '';
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
});
