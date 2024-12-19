import json

class CardLooper:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required":
                {
                    "json_input": ("JSON", {"forceInput": True}),
                },
            }
    
    RETURN_TYPES = ("CARD",)  # Returning a list of dictionaries
    RETURN_NAMEs = ("CARDS",)  # Returning a list of dictionaries
    FUNCTION = "process_json"

    def process_json(self, **kwargs):

        
        try:
            
            # this works: data = {"x": {"a":"1"}, "y": {"a":"2"}, "z": {"a":"3"}}
            json_input = kwargs.pop('json_input', None)
            if isinstance(json_input, str):
                data = json.loads(json_input)  # Parse the JSON string
            elif isinstance(json_input, dict):
                data = json_input  # Use the dictionary directly
            else:
                return ([{"error": "Input must be a JSON string or dictionary"}],)
            
            #print(data)
            #if not isinstance(data, dict):
            #    return ([{"error": "Input must be a JSON object"}],)

            # output_list = []
            # for main_key, sub_obj in data.items():
            #     if isinstance(sub_obj, dict):
            #         for sub_key, value in sub_obj.items():
            #             output_list.append({"key": main_key, "property": sub_key, "value": value})
            #     else:
            #         output_list.append({"key": main_key, "property": None, "value": sub_obj})
            out = data.values()
            return (out,)  # Return a list of dictionaries
        except Exception as e:
            return ([{"error": str(e)}],)
        

        
        


# make a new class node representing the card card accepts the ouptut from CardLooper and ouptuts the id field and type field from the input, it will process one single entry


