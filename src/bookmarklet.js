javascript: (function (s) {
  const messages = document.getElementsByClassName("x78zum5 xdt5ytf x1iyjqo2 xs83m0k x1xzczws x6ikm8r x1rife3k x1n2onr6 xh8yej3")[1].childNodes[2];
  messages.removeEventListener("DOMNodeInserted", null);
  messages.addEventListener("DOMNodeInserted", async (event) => {
    const imgSrc = event?.target?.getElementsByTagName("img")[1]?.src;
    if (imgSrc) {
      const res = await fetch("http://localhost:3103/api/get-detection", {
        method: "POST",
        body: JSON.stringify({ imageUrl: imgSrc }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        // Display the annotated image
        const img = document.createElement("img");
        img.src = objectUrl;
        img.style.border = "2px solid green";
        img.style.marginTop = "10px";

        // Append the image to the DOM
        document.body.appendChild(img);
      } else {
        console.error("Failed to fetch annotated image:", res.status);
      }
    }
  });
  alert("Added Messenger Chat Observer");
})();
