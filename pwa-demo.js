// 📌 Install PWA
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (event) => {
    //event.preventDefault(); // Prevent default prompt
    deferredPrompt = event;
    installBtn.style.display = 'block'; // Show install button
});

installBtn.addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
});

// 📌 Get Location
document.getElementById('location-btn').addEventListener('click', () => {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            document.getElementById('output').textContent = 
                `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
        }, (error) => {
            document.getElementById('output').textContent = 'Error getting location: ' + error.message;
        });
    } else {
        document.getElementById('output').textContent = 'Geolocation not supported.';
    }
});

// 📌 Save File
document.getElementById('save-btn').addEventListener('click', () => {
    const data = "Hello, this is a PWA demo file!";
    const blob = new Blob([data], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pwa-demo.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// 📌 Share Site
document.getElementById('share-btn').addEventListener('click', () => {
    if (navigator.canShare) {
        navigator.share({
            url: 'CalebsSite.com',
            title: 'Calebs PWA',
            text: 'New PWA Site'
        })
    }
});

const props = ['name', 'email', 'tel', 'address', 'icon'];  // 🔹 'tele' → 'tel' (correct spelling)
const opts = { multiple: true };

// 📌 Contacts
document.getElementById('contacts-btn').addEventListener('click', async () => {  // 🔹 Make callback async
    if ('contacts' in navigator && 'ContactsManager' in window) {
        try {
            const contacts = await navigator.contacts.select(props, opts);  // 🔹 Fixed variable name
            console.log('Selected contacts:', contacts);
        } catch (error) {
            console.error('Error selecting contacts:', error);
        }
    } else {
        console.warn('Contact Picker API not supported.');
    }
});

document.getElementById('start-idle-detection').addEventListener('click', async () => {
    if (!('IdleDetector' in window)) {
        console.warn('Idle Detection API is not supported on this browser.');
        return;
    }

    try {
        // Request Notification permission
        const notificationPermission = await Notification.requestPermission();
        if (notificationPermission !== 'granted') {
            console.warn('Notification permission not granted.');
            return;
        }

        await IdleDetector.requestPermission(); // Request permission

        // Request Idle Detection permission
        const idlePermission = await navigator.permissions.query({ name: 'idle-detection' });
        if (idlePermission.state !== 'granted') {
            console.warn('Idle Detection permission not granted.');
            return;
        }

        // Create IdleDetector instance
        const idleDetector = new IdleDetector();

        // Start detecting idle state with a lower threshold for testing
        const controller = new AbortController();
        await idleDetector.start({
            threshold: 60000, // 1 second for testing
            signal: controller.signal
        });

        // Listen for idle state changes
        idleDetector.addEventListener('change', () => {
            console.log('IdleDetector state changed:', idleDetector.userState);
            if (idleDetector.userState != 'active') {
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
});