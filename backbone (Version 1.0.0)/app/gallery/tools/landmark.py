def detect_landmarks(path, landmark_dict):
    """
    Detects landmarks in an image file using Google Cloud Vision API.
    
    Args:
        path (str): Path to the image file to analyze. Can be relative or absolute.
                    Supported formats include JPEG, PNG, GIF, BMP, WEBP, RAW, ICO.
    
    Returns:
        dict: A dictionary where keys are landmark names and values are lists of 
              location dictionaries containing latitude and longitude coordinates.
              Returns an empty dict if no landmarks are detected.
    
    Raises:
        FileNotFoundError: If the image file doesn't exist
        Exception: If the Google Cloud Vision API returns an error
    """
    from google.cloud import vision
    import os
    from dotenv import load_dotenv
    print('CALLED LANDMARK')
    # Load environment variables from .env file
    load_dotenv()
    
    # Get API key from environment variable
    api_key = os.getenv("GOOGLE")
    if not api_key:
        print("Warning: GOOGLE API key not found in environment variables")
        return {}
    
    #sets up the client
    client_options = {"api_key": api_key}
    client = vision.ImageAnnotatorClient(client_options=client_options)

    # Verify file exists
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Image file not found: {path}")

    with open(path, "rb") as image_file:
        content = image_file.read()

    image = vision.Image(content=content)
    print('Getting landmarks')
    response = client.landmark_detection(image=image)
    landmarks = response.landmark_annotations
    print('Landmarks detected: ' + str(landmarks))

    # Check for API errors
    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )
    
    # Process landmarks
    for landmark in landmarks:
        locations = []
        for location in landmark.locations:
            lat_lng = location.lat_lng
            locations.append({
                'latitude': lat_lng.latitude,
                'longitude': lat_lng.longitude
            })
        landmark_dict[landmark.description] = locations
        
    return landmark_dict

if __name__ == "__main__":
    landmark_dict = detect_landmarks("landmark_test.png")
    print(landmark_dict)
