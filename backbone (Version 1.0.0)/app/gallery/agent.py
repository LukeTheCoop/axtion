from app.gallery.config import GalleryConfig
from openai import OpenAI
from app.gallery.landmark_service import landmark_pipeline

class Agent:
    def __init__(self, genre: str):
        self.genre = genre
        self.config = GalleryConfig(genre)
        # Get API key from environment variables
        import os
        from dotenv import load_dotenv
        
        # Load environment variables
        load_dotenv()
        
        # Get the CLOSEDAI API key
        self.api_key = os.getenv("CLOSEDAI")
        if not self.api_key:
            print("Warning: CLOSEDAI API key not found in environment variables")
        self.client = client = OpenAI(api_key=self.api_key)
        
        # Load prompt from agent.json
        import os
        import json
        
        agent_json_path = os.path.join("app", "gallery", "data", "agents", "agent.json")
        try:
            with open(agent_json_path, 'r') as f:
                agent_data = json.load(f)
                self.developer_prompt = agent_data.get("prompt", "")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error loading agent prompt: {str(e)}")
            self.developer_prompt = ""

    def load_tools(self):
        tools = [{
        "type": "function",
        "function": {
            "name": "get_landmark",
            "description": "Identifies landmarks in the user's uploaded image using Google Cloud Vision API. Returns name and location information for any landmarks detected.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "returns": {
                "type": "object",
                "description": "A dictionary mapping landmark names to their geographical coordinates"
            },
            "strict": True
            }
        }]
        return tools

    def add_video(self, video_name: str, video_url: str):
        self.config.add_video(video_name, video_url)
    
    def get_landmark(self):
        landmark_dict = landmark_pipeline(self.config, self.view)
        return landmark_dict
    
    def agent_response(self, prompt: str):

        messages = [
            {"role": "developer", "content": self.developer_prompt},
            {"role": "user", "content": prompt}
        ]
        completion = self.client.chat.completions.create(
        model="o3-mini",
        messages=messages,
        tools=self.load_tools()
        )

        if completion.choices[0].message.tool_calls:
            for tool_call in completion.choices[0].message.tool_calls:
                if tool_call.function.name == "get_landmark":
                    image_path = tool_call.function.arguments
                    landmark_dict = self.get_landmark(image_path)
                    print(landmark_dict)
                    messages.append(completion.choices[0].message)  # append model's function call message
                    messages.append({                               # append result message
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(landmark_dict)
                    })
                    completion_2 = self.client.chat.completions.create(
                        model="o3-mini",
                        messages=messages,
                        tools=self.load_tools()
                    )
                    return completion_2.choices[0].message.content
                
        return completion.choices[0].message.content
if __name__ == "__main__":
    from config import GalleryConfig
    from openai import OpenAI
    from tools.landmark import detect_landmarks
    agent = Agent("military")
    print(agent.agent_response("Find the landmarks in this image", "https://www.youtube.com/shorts/18zAv6zzOhY"))


    