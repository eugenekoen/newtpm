$(function () {
    $("pre").transpose();

    // Add an ID to the <pre> element for easy targeting
    const preElement = document.getElementById('song-lyrics');

    // Get the slider element
    const scrollSpeedSlider = document.getElementById('scroll-speed');

    // Initialize the interval variable
    let scrollInterval;

    // Define scroll speeds (adjust these values as needed)
    const scrollSpeeds = [0, 1, 2, 3]; // 0 for stop, 5 for slow, 10 for medium, 15 for fast

    // Function to handle scroll speed changes
    function handleScrollSpeedChange() {
        // Clear any existing scroll interval
        clearInterval(scrollInterval);

        // Get the value of the slider
        const speed = parseInt(scrollSpeedSlider.value);

        // Calculate the scroll amount based on the selected speed
        const scrollAmount = scrollSpeeds[speed];

        // Create an interval to continuously scroll (if not stopped)
        if (scrollAmount > 0) {
            scrollInterval = setInterval(() => {
                preElement.scrollTop += scrollAmount;
            }, 100); // Adjust the interval timing as needed
        }
    }

    // Attach an event listener to the slider
    scrollSpeedSlider.addEventListener('input', handleScrollSpeedChange);

    // Trigger initial scroll speed setup
    handleScrollSpeedChange();

    // Dynamically set the height of the <pre> element to match the device's screen height
    function adjustPreElementHeight() {
        const windowHeight = window.innerHeight;
        preElement.style.height = windowHeight + 'px';

        // Apply overflow: auto to enable scrolling if necessary
        preElement.style.overflow = preElement.scrollHeight > windowHeight ? 'auto' : 'hidden';
    }

    // Call the function to adjust the <pre> element's height initially
    adjustPreElementHeight();

    // Add an event listener to handle window resize events
    window.addEventListener('resize', adjustPreElementHeight);
});