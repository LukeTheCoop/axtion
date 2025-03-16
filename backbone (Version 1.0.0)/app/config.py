import json
class Config:
    def __init__(self, genre: str, agent: str):
        self.genre = genre
        self.agent = agent

        

    def config_pipeline(self, object, action, data):
        if object == 'agent':
            self.agent_data(action, data)
        elif object == 'music':
            self.music_data(action, data)
        elif object == 'voice':
            self.voice_data(action, data)
        elif object == 'user':
            self.user_data(action, data)

    def training_data(self):
        print(f"Training data: {self.agent}")
        if self.agent == "lite":
            self.agent_path = f"app/data/agent/{self.genre}/lite/agent.json"
        elif self.agent == "medium":
            self.agent_path = f"app/data/agent/{self.genre}/medium/agent.json"
        elif self.agent == "large":
            self.agent_path = f"app/data/agent/{self.genre}/large/agent.json"
            
        with open(self.agent_path, "r") as f:
            self.agent_training_data = json.load(f)

    def music_data(self, action, data):
        self.music_path = f"app/data/config/music/music_config.json"
        if action == 'update':
            with open(self.music_path, "w") as f:
                json.dump(data, f)

        with open(self.music_path, "r") as f:
            self.data = json.load(f)

        return self.data

    def voice_data(self, action, data):
        self.voice_path = f"app/data/config/voice/voice_config.json"
        if action == 'update':
            with open(self.voice_path, "w") as f:
                json.dump(data, f)

        with open(self.voice_path, "r") as f:
            self.data = json.load(f)
                
        return self.data
    
    def agent_data(self, action, data):
        self.agent_system_path = f"app/data/config/agents/{self.agent}/agent_config.json"
        if action == 'update':
            with open(self.agent_system_path, "w") as f:
                json.dump(data, f)

        with open(self.agent_system_path, "r") as f:
            self.data = json.load(f)

        return self.data
    
    def user_data(self, action, data):
        self.user_path = f"app/data/config/user/user_config.json"
        if action == 'update':
            with open(self.user_path, "w") as f:
                json.dump(data, f)

        with open(self.user_path, "r") as f:
            self.data = json.load(f)

        return self.data
                
    def update_training_data(self, action, data):
        data_dict = self.agent_training_data

        if action == "script":
            pass


if __name__ == "__main__":
    config = Config("military", "medium")

    print(config.agent_data()['system_prompt'])

    # for i in config.agent_training_data:
    #     for line in config.agent_training_data[i]:
    #         if isinstance(line, dict) and 'line' in line:
    #             print(line['line'])



    # new_example = {'new_example': 'The Korean War represents a critical turning point in modern military history. When North Korean forces crossed the 38th parallel in June 1950, they triggered a conflict that would test new tactics and technologies in the post-World War II era. Under the United Nations Command, a multinational force led by the United States engaged in a dynamic three-year campaign against North Korean and later Chinese forces. The conflict saw the first widespread use of jet aircraft in combat, with F-86 Sabres dueling against MiG-15s in high-altitude dogfights. On the ground, integrated armor and infantry tactics evolved to address the challenges of mountainous terrain. Marine amphibious landings, most notably at Inchon, demonstrated the continuing relevance of naval power projection. The war ultimately settled into a stalemate along roughly the original border, establishing a pattern that would characterize many future conflicts - limited wars fought for limited objectives under the shadow of nuclear deterrence.'}
    # config.update_training_data("military", "script", new_example)