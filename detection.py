import requests
import cv2
# import tensorflow as tf
import numpy as np
from PIL import Image
import time

# Configuration
ACCESS_TOKEN = "INSERT HERE"
LIVE_STREAM_ENDPOINT = "https://graph.facebook.com/v22.0/ID?fields=ingest_streams"
SEND_DM_ENDPOINT = "https://graph.facebook.com/v22.0/me/messages"
REVERSE_SEARCH_API_URL = "https://api.tineye.com/rest/search/"
REVERSE_SEARCH_AUTH = ('api_username', 'api_key')  # TinEye credentials
FRAME_CAPTURE_INTERVAL = 10  # Capture frame every 5 seconds
CLOTHING_CLASS_ID = 5  # Example ID for clothing class (modify this as needed)

# Load your object detection model
# MODEL_PATH = "path_to_your_saved_model"
# object_detection_model = tf.saved_model.load(MODEL_PATH)

def get_live_stream():
    first = requests.get(f"https://graph.facebook.com/v22.0/ID/live_videos", params={"access_token": ACCESS_TOKEN})
    print("first")
    print(first.json())
    response = requests.get(LIVE_STREAM_ENDPOINT, params={"access_token": ACCESS_TOKEN})
    live_stream_data = response.json()
    print("next")
    print(live_stream_data)
    if "ingest_streams" in live_stream_data and len(live_stream_data["data"]) > 0:
        return live_stream_data["data"][0]["stream_url"]  # Adjust based on actual response
    else:
        print("No active livestream found.")
        return None

def capture_frame(video_url):
    cap = cv2.VideoCapture(video_url)
    ret, frame = cap.read()
    if ret:
        frame_path = "current_frame.jpg"
        cv2.imwrite(frame_path, frame)
        cap.release()
        return frame_path
    cap.release()
    return None

def detect_clothing_items(frame_path):
    image = Image.open(frame_path)
    input_tensor = tf.convert_to_tensor(np.array(image))[tf.newaxis, ...]
    detections = object_detection_model(input_tensor)

    detection_classes = detections['detection_classes'].numpy()[0]
    detection_boxes = detections['detection_boxes'].numpy()[0]
    detection_scores = detections['detection_scores'].numpy()[0]

    # Filter for clothing items with high confidence
    clothing_items = [
        (box, score) for box, score, cls in zip(detection_boxes, detection_scores, detection_classes)
        if cls == CLOTHING_CLASS_ID and score > 0.5
    ]

    return clothing_items

def reverse_image_search(image_path):
    files = {'image': open(image_path, 'rb')}
    response = requests.post(REVERSE_SEARCH_API_URL, files=files, auth=REVERSE_SEARCH_AUTH)
    search_results = response.json()
    
    if search_results.get('matches'):
        return search_results['matches'][0]['link']
    return None

def send_dm(recipient_id, message):
    headers = {"Content-Type": "application/json"}
    data = {
        "recipient": {"id": recipient_id},
        "message": {"text": message}
    }

    response = requests.post(SEND_DM_ENDPOINT, json=data, params={"access_token": ACCESS_TOKEN}, headers=headers)
    return response.json()

def main():
    while True:
        get_live_stream()
        time.sleep(10)
    if not video_url:
        print("No active livestream available.")
        return

    while True:
        frame_path = capture_frame(video_url)
        if frame_path:
            clothing_items = detect_clothing_items(frame_path)
            if clothing_items:
                print("Clothing items detected.")
                # Crop and process each detected item (optional improvement)
                for idx, (box, score) in enumerate(clothing_items):
                    # Perform reverse image search on the full frame (or cropped item)
                    product_link = reverse_image_search(frame_path)
                    if product_link:
                        print(f"Product found: {product_link}")
                        send_dm("user_facebook_id", f"Found clothing item: {product_link}")
            else:
                print("No clothing items detected in this frame.")

        # Wait before capturing the next frame
        time.sleep(FRAME_CAPTURE_INTERVAL)

if __name__ == "__main__":
    main()