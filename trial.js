import * as faceapi from 'face-api.js';
import canvas from 'canvas';
import fs from 'fs';
import path from 'path';

// Set up Canvas and Face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load models
async function loadModels() {
    const modelPath = 'models'; // Path to face-api.js models
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath); // Load face detection model
    await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);   // Load age and gender model
}

// Detect faces, age, and gender, and save the image
async function detectAndSave(inputImagePath, outputImagePath) {
    // Load the input image
    const img = await canvas.loadImage(inputImagePath);

    // Create a canvas to draw the image and detections
    const outCanvas = canvas.createCanvas(img.width, img.height);
    const ctx = outCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Detect faces
    const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options())
                                    .withAgeAndGender();

    // Draw rectangles and age/gender labels around detected faces
    detections.forEach(detection => {
        const { age, gender, genderProbability } = detection;
        const box = detection.detection.box;

        // Draw bounding box
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Annotate with age and gender
        const text = `${Math.round(age)} years, ${gender} (${Math.round(genderProbability * 100)}%)`;
        ctx.fillStyle = 'blue';
        ctx.font = '100px Arial';
        ctx.fillText(text, box.x, box.y - 10); // Position text above the box
    });

    // Save the output image
    const out = fs.createWriteStream(outputImagePath);
    const stream = outCanvas.createJPEGStream();
    stream.pipe(out);
    out.on('finish', () => console.log('Image with detections saved to:', outputImagePath));
}

// Main execution
(async () => {
    await loadModels();
    const inputImagePath = './input.jpg'; // Replace with your input image path
    const outputImagePath = './output.jpg'; // Replace with your desired output path
    await detectAndSave(inputImagePath, outputImagePath);
})();
