import anthropic
import os
from dotenv import load_dotenv
from config import Config
import json

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTRO_CHAT"))
    
class Agent_Medium:
    def __init__(self, instructions, mothership, prompt, video_list):
        self.client = client
        self.instructions = instructions
        self.mothership = mothership
        self.prompt = prompt
        self.video_list = video_list

        config = Config("military", "medium")
        config.training_data()

        self.agent_training_data = config.agent_training_data

    def merge_prompt(self):
        final_prompt = f"""
        Here are your instructions:
        {self.instructions}

        Here is the video list:
        {self.video_list}

        Here are example responses:
        {self.agent_training_data}
        
        Your response should be in the same format as the example responses with the overarching key 'config'. When finished, add final to the end of your response outside of the json object.
        """

        return final_prompt
    
    def user_prompt(self):
        user_prompt = f"""
        Here is the mothership:
        {self.mothership}

        Here is the user prompt:
        {self.prompt}

        Ensure your videos match each line perfectly, revolving each line around the video.
        """
        return user_prompt
    
    def generate_response(self):
        finished = False
        num = 0
        messages = [{"role": "user", "content": self.user_prompt()}]
        while not finished:
            num += 1
            response = self.client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=8000,
                temperature=0.7,  # Add some creativity while maintaining coherence
                system=self.merge_prompt(),
                messages=messages

            )
            messages.append({"role": "assistant", "content": response.content[0].text.strip()})
            if 'final' in response.content[0].text.strip():
                finished = True
            print(f"Response {num}: {response.content[0].text.strip()}\n\n")

        return response.content[0].text.strip()

if __name__ == "__main__":
    with open("video_list.json", "r") as f:
        video_list = json.load(f)
    agent = Agent_Medium("You create videos. You write lines and choose videos to go along with them.", "Be creative", "Write a short military story about a tank battle.", str(video_list))
    print(agent.merge_prompt())

    agent.generate_response()


