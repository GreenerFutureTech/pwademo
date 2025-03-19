document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-idle-detection');
    
    if (startButton) {
        startButton.addEventListener('click', startIdleDetection);
    }
});

async function startIdleDetection() {
    if (!('IdleDetector' in window)) {
        console.warn('Idle Detection API is not supported on this browser.');
        return;
    }

    try {
        // Request Idle Detection permission
        const idlePermission = await navigator.permissions.query({ name: 'idle-detection' });
        if (idlePermission.state !== 'granted') {
            console.warn('Idle Detection permission not granted.');
            return;
        }

        // Request Notification permission
        const notificationPermission = await Notification.requestPermission();
        if (notificationPermission !== 'granted') {
            console.warn('Notification permission not granted.');
            return;
        }

        // Create IdleDetector instance
        const idleDetector = new IdleDetector();

        // Start detecting idle state
        await idleDetector.start({
            threshold: 5_000, // 1 minute of inactivity
            signal: new AbortController().signal
        });

        // Listen for idle state changes
        idleDetector.addEventListener('change', () => {
            if (idleDetector.userState === 'idle') {
                console.log('User is idle. Sending notification...');
                new Notification('Idle Alert', {
                    body: 'You have been inactive for a while!',
                    icon: '/icon.png'
                });
            }
        });

        console.log('Idle Detection started.');
    } catch (error) {
        console.error('Error starting Idle Detection:', error);
    }
}