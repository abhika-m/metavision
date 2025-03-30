import http from 'http';
import * as faceapi from 'face-api.js';
import canvas from 'canvas';
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
let cachedImage = null;
const PORT = 3103;
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Headers": "Content-Type",
};
// Load face-api.js models
async function loadModels() {
    const modelPath = 'models'; // Path to models directory
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);
}
loadModels().catch(console.error);
// Process image URL and return annotated image as binary
async function processImage(imageUrl) {
    const img = await canvas.loadImage(imageUrl);

    const outCanvas = canvas.createCanvas(img.width, img.height);
    const ctx = outCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options()).withAgeAndGender();
    console.log(detections);

    detections.forEach(detection => {
        const box = detection.detection.box; // Access the box using detection.detection.box
        const { age, gender, genderProbability } = detection;

        // Draw bounding box
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Annotate with age and gender
        const label = `${Math.round(age)} yrs, ${gender} (${Math.round(genderProbability * 100)}%)`;
        ctx.fillStyle = 'black';
        ctx.font = '100px Arial';
        ctx.fillText(label, box.x, box.y - 10);
    });

    cachedImage = outCanvas.toBuffer('image/jpeg');
    return cachedImage;
}
// Handle incoming requests
function requestHandler(req, res) {
    if (req.method === "OPTIONS") {
        res.writeHead(200, CORS_HEADERS);
        res.end();
        return;
    }
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    if (url.pathname === "/api/get-detection" && req.method === "POST") {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', async () => {
            try {
                const { imageUrl } = JSON.parse(body);
                const annotatedImage = await processImage(imageUrl);
                res.writeHead(200, {
                    "Content-Type": "image/jpeg",
                    ...CORS_HEADERS,
                });
                res.end(annotatedImage);
            }
            catch (error) {
                console.error("Error processing image:", error);
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal Server Error");
            }
        });
    } else if (req.method === "GET" && url.pathname === "/last-annotated-image") {
        if (cachedImage) {
            res.writeHead(200, { "Content-Type": "image/jpeg" });
            res.end(cachedImage);
        } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("No annotated image available.");
        }
    }
    else if (url.pathname === "/api/status") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Server Up!");
    }
    else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
}
// Create and start the HTTP server
const server = http.createServer(requestHandler);
server.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});
