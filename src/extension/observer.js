(function () {
    const messagesContainer = document.querySelectorAll(
        '[data-testid="messenger_inbox_message_list"]'
    )[0];

    if (!messagesContainer) {
        console.error("Messenger message container not found.");
        return;
    }

    messagesContainer.addEventListener("DOMNodeInserted", async (event) => {
        const messageElement = event.target;
        const imgElement = messageElement.querySelector("img");

        if (imgElement && imgElement.src) {
            const imageUrl = imgElement.src;

            try {
                const response = await fetch("http://localhost:3103/api/get-detection", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ imageUrl }),
                });

                if (response.ok) {
                    console.log("Image sent successfully:", imageUrl);
                } else {
                    console.error("Failed to send image:", response.status);
                }
            } catch (error) {
                console.error("Error sending image:", error);
            }
        }
    });

    console.log("Messenger observer added!");
})();
